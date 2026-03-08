# SnapSight AI — Azure Deployment Guide

## Overview

This guide walks through deploying SnapSight AI to Azure using Docker containers and Bicep Infrastructure-as-Code.

## Prerequisites

- **Azure CLI** — [Install](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- **Docker** — [Install](https://www.docker.com/products/docker-desktop)
- **Azure Subscription** — With permissions to create resources
- **GitHub Repository Access** — To configure secrets

## Step 1: Create Azure Resources

### 1.1 Set Variables
```bash
AZURE_SUBSCRIPTION_ID="your-subscription-id"
AZURE_RESOURCE_GROUP="snapsight-ai-rg"
AZURE_LOCATION="eastus"
```

### 1.2 Log in to Azure
```bash
az login
az account set --subscription $AZURE_SUBSCRIPTION_ID
```

### 1.3 Create Resource Group
```bash
az group create \
  --name $AZURE_RESOURCE_GROUP \
  --location $AZURE_LOCATION
```

### 1.4 Create Service Principal (for CI/CD)
```bash
az ad sp create-for-rbac \
  --name snapsight-ai-sp \
  --role contributor \
  --scopes /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$AZURE_RESOURCE_GROUP
```

Save the JSON output—you'll need it for GitHub secrets.

## Step 2: Update Bicep Parameters

Edit `infra/parameters.json` with your actual values:

```json
{
  "parameters": {
    "appName": { "value": "snapsight-ai" },
    "location": { "value": "eastus" },
    "azureOpenaiEndpoint": { "value": "https://your-openai.openai.azure.com/" },
    "azureOpenaiKey": { "value": "your-key" },
    "azureSqlServer": { "value": "yourserver.database.windows.net" },
    "azureSqlDatabase": { "value": "snapsight_db" },
    "azureSqlUsername": { "value": "sqladmin" },
    "azureSqlPassword": { "value": "YourSecurePassword123!" },
    "backendImageUri": { "value": "your-acr.azurecr.io/snapsight-backend:latest" },
    "frontendImageUri": { "value": "your-acr.azurecr.io/snapsight-frontend:latest" }
  }
}
```

## Step 3: Configure GitHub Secrets

In your GitHub repository (Settings → Secrets and variables → Actions), add:

| Secret Name | Value |
|---|---|
| `ACR_LOGIN_SERVER` | `your-acr.azurecr.io` |
| `ACR_USERNAME` | Azure Container Registry username |
| `ACR_PASSWORD` | Azure Container Registry password |
| `AZURE_CREDENTIALS` | Service Principal JSON from Step 1.4 |
| `AZURE_RESOURCE_GROUP` | `snapsight-ai-rg` |

### Getting ACR Credentials
```bash
az acr credential show \
  --name snapsightaiAcr \
  --query "passwords[0].[name, value]" -o tsv
```

## Step 4: Deploy Infrastructure

### Option A: Manual Deployment (one-time setup)
```bash
az deployment group create \
  --resource-group $AZURE_RESOURCE_GROUP \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json
```

### Option B: Using Deploy Script (recommended)
```bash
chmod +x deploy.sh
./deploy.sh --resource-group $AZURE_RESOURCE_GROUP --parameters infra/parameters.json
```

## Step 5: Build & Push Images to Azure Container Registry

```bash
# Log in to ACR
az acr login --name snapsightaiAcr

# Build and push backend
docker build -t snapsightaiAcr.azurecr.io/snapsight-backend:latest ./backend
docker push snapsightaiAcr.azurecr.io/snapsight-backend:latest

# Build and push frontend
docker build \
  --build-arg REACT_APP_API_BASE=https://snapsight-ai-backend.azurewebsites.net \
  -t snapsightaiAcr.azurecr.io/snapsight-frontend:latest \
  ./frontend
docker push snapsightaiAcr.azurecr.io/snapsight-frontend:latest
```

## Step 6: Verify Deployment

### Check App Services
```bash
az webapp list --resource-group $AZURE_RESOURCE_GROUP --query "[].defaultHostName" -o table
```

### Test Backend Health
```bash
curl https://snapsight-ai-backend.azurewebsites.net/health
```

### Test Frontend
Open in browser: `https://snapsight-ai-frontend.azurewebsites.net`

## Step 7: Set Up CI/CD

The `.github/workflows/deploy.yml` workflow will:
1. Build Docker images on every push to `main`
2. Push to Azure Container Registry
3. Deploy new images to App Services

**No additional setup required** — just push to GitHub and watch Actions run.

## Troubleshooting

### Images won't pull from ACR
- Verify `DOCKER_REGISTRY_SERVER_*` environment variables in App Service settings
- Check ACR credentials: `az acr credential show --name snapsightaiAcr`

### Frontend can't reach backend
- Verify `REACT_APP_API_BASE` environment variable matches backend URL
- Check CORS settings in backend (should be `*`)
- Inspect browser console for network errors

### App Service won't start
- Check Logs: `az webapp log tail --name snapsight-ai-backend --resource-group $AZURE_RESOURCE_GROUP`
- Verify all environment variables are set correctly

### Bicep validation fails
```bash
az deployment group validate \
  --resource-group $AZURE_RESOURCE_GROUP \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json
```

## Local Development

To test locally before Azure deployment:

```bash
# Build and run containers
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## Cost Optimization

Current Bicep template uses **B1 (Basic)** App Service Plan (~$12/month). For production, consider:
- **B2** for more capacity (~$24/month)
- **Standard tier** with auto-scaling
- **Azure Container Instances** if traffic is unpredictable

## Next Steps

1. Monitor application in Azure Portal
2. Set up Application Insights for logging
3. Configure custom domain name
4. Enable HTTPS with managed certificates (automatic with App Service)
5. Back up database regularly

## Support

For issues with:
- **Bicep/Azure**: [Azure Bicep docs](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- **FastAPI Backend**: [FastAPI docs](https://fastapi.tiangolo.com/)
- **React Frontend**: [Create React App docs](https://create-react-app.dev/)
- **Docker**: [Docker docs](https://docs.docker.com/)
