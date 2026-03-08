#!/bin/bash

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Defaults
RESOURCE_GROUP=""
PARAMETERS_FILE="infra/parameters.json"
LOCATION="eastus"
APP_NAME="snapsight-ai"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --parameters)
      PARAMETERS_FILE="$2"
      shift 2
      ;;
    --location)
      LOCATION="$2"
      shift 2
      ;;
    --app-name)
      APP_NAME="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$RESOURCE_GROUP" ]; then
  echo -e "${RED}Error: --resource-group is required${NC}"
  echo "Usage: $0 --resource-group <name> [--parameters <file>] [--location <region>]"
  exit 1
fi

if [ ! -f "$PARAMETERS_FILE" ]; then
  echo -e "${RED}Error: Parameters file not found: $PARAMETERS_FILE${NC}"
  exit 1
fi

# Functions
log_step() {
  echo -e "${GREEN}==>${NC} $1"
}

log_error() {
  echo -e "${RED}Error:${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}Warning:${NC} $1"
}

check_prerequisites() {
  log_step "Checking prerequisites..."

  if ! command -v az &> /dev/null; then
    log_error "Azure CLI not found. Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
  fi

  if ! command -v docker &> /dev/null; then
    log_error "Docker not found. Install from: https://www.docker.com/products/docker-desktop"
    exit 1
  fi

  echo "  ✓ Azure CLI installed"
  echo "  ✓ Docker installed"
}

check_azure_login() {
  log_step "Checking Azure login..."

  if ! az account show &> /dev/null; then
    log_error "Not logged into Azure. Run: az login"
    exit 1
  fi

  CURRENT_ACCOUNT=$(az account show --query "name" -o tsv)
  echo "  ✓ Logged in as: $CURRENT_ACCOUNT"
}

check_resource_group() {
  log_step "Checking resource group..."

  if ! az group exists --name "$RESOURCE_GROUP" --query value -o tsv | grep -q true; then
    log_error "Resource group does not exist: $RESOURCE_GROUP"
    echo "Create it with: az group create --name $RESOURCE_GROUP --location $LOCATION"
    exit 1
  fi

  echo "  ✓ Resource group exists: $RESOURCE_GROUP"
}

validate_bicep() {
  log_step "Validating Bicep template..."

  az deployment group validate \
    --resource-group "$RESOURCE_GROUP" \
    --template-file infra/main.bicep \
    --parameters "$PARAMETERS_FILE" > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "  ✓ Bicep template is valid"
  else
    log_error "Bicep template validation failed"
    az deployment group validate \
      --resource-group "$RESOURCE_GROUP" \
      --template-file infra/main.bicep \
      --parameters "$PARAMETERS_FILE"
    exit 1
  fi
}

deploy_infrastructure() {
  log_step "Deploying Azure infrastructure..."
  echo "  This may take 3-5 minutes..."

  DEPLOYMENT_NAME="snapsight-$(date +%s)"

  az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file infra/main.bicep \
    --parameters "$PARAMETERS_FILE" \
    --name "$DEPLOYMENT_NAME"

  if [ $? -eq 0 ]; then
    echo "  ✓ Infrastructure deployed successfully"
  else
    log_error "Infrastructure deployment failed"
    exit 1
  fi
}

get_deployment_outputs() {
  log_step "Getting deployment outputs..."

  OUTPUTS=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query "properties.outputs" -o json)

  BACKEND_URL=$(echo "$OUTPUTS" | jq -r '.backendAppServiceUrl.value')
  FRONTEND_URL=$(echo "$OUTPUTS" | jq -r '.frontendAppServiceUrl.value')
  ACR_SERVER=$(echo "$OUTPUTS" | jq -r '.acrLoginServer.value')

  echo "  Backend: $BACKEND_URL"
  echo "  Frontend: $FRONTEND_URL"
  echo "  ACR: $ACR_SERVER"
}

show_next_steps() {
  log_step "Deployment complete!"
  echo ""
  echo "Next steps:"
  echo "1. Build and push Docker images to ACR:"
  echo "   az acr login --name $(echo $ACR_SERVER | cut -d. -f1)"
  echo "   docker build -t $ACR_SERVER/snapsight-backend:latest ./backend"
  echo "   docker push $ACR_SERVER/snapsight-backend:latest"
  echo ""
  echo "   docker build --build-arg REACT_APP_API_BASE=$BACKEND_URL -t $ACR_SERVER/snapsight-frontend:latest ./frontend"
  echo "   docker push $ACR_SERVER/snapsight-frontend:latest"
  echo ""
  echo "2. Update image URIs in App Services (or let CI/CD handle it)"
  echo ""
  echo "3. Access your applications:"
  echo "   Frontend: $FRONTEND_URL"
  echo "   Backend: $BACKEND_URL/health"
  echo ""
  echo "For more details, see DEPLOYMENT.md"
}

# Main execution
main() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║        SnapSight AI — Azure Deployment Script              ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""

  check_prerequisites
  check_azure_login
  check_resource_group
  validate_bicep
  deploy_infrastructure
  get_deployment_outputs
  show_next_steps

  echo ""
  echo -e "${GREEN}✓ Deployment script completed successfully${NC}"
  echo ""
}

main
