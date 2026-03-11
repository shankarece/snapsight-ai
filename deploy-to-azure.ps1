# SnapSight AI - Azure Deployment Script
# Run: powershell -ExecutionPolicy Bypass -File deploy-to-azure.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SnapSight AI - Azure Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow
$azCli = az --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Azure CLI not installed. Visit: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Azure CLI installed" -ForegroundColor Green

$docker = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker not installed. Visit: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker installed" -ForegroundColor Green
Write-Host ""

# Login to Azure
Write-Host "[2/5] Logging into Azure..." -ForegroundColor Yellow
az login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Azure login failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in to Azure" -ForegroundColor Green
Write-Host ""

# Create resource group
Write-Host "[3/5] Creating Azure resources..." -ForegroundColor Yellow
$resourceGroup = "snapsight-ai-rg"
$location = "eastus"
$registryName = "snapsightai"

Write-Host "Creating resource group: $resourceGroup"
az group create --name $resourceGroup --location $location
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create resource group" -ForegroundColor Red
    exit 1
}

Write-Host "Creating container registry: $registryName"
az acr create `
  --resource-group $resourceGroup `
  --name $registryName `
  --sku Basic `
  --admin-enabled true

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create container registry" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Azure resources created" -ForegroundColor Green
Write-Host ""

# Build Docker images
Write-Host "[4/5] Building Docker images..." -ForegroundColor Yellow
$registryUrl = "$registryName.azurecr.io"

Write-Host "Building backend image..."
docker build -f Dockerfile.backend -t "$registryUrl/snapsight-ai-backend:latest" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build backend image" -ForegroundColor Red
    exit 1
}

Write-Host "Building frontend image..."
docker build -f Dockerfile.frontend -t "$registryUrl/snapsight-ai-frontend:latest" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker images built" -ForegroundColor Green
Write-Host ""

# Push to registry
Write-Host "[5/5] Pushing images to Azure Container Registry..." -ForegroundColor Yellow

Write-Host "Logging into Azure Container Registry..."
az acr login --name $registryName
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to registry" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing backend image..."
docker push "$registryUrl/snapsight-ai-backend:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push backend image" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing frontend image..."
docker push "$registryUrl/snapsight-ai-frontend:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push frontend image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Images pushed to registry" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT PHASE 1 COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create azure-deploy-params.json with your credentials"
Write-Host "2. Run: az deployment group create --resource-group snapsight-ai-rg --template-file azure-deploy.bicep --parameters @azure-deploy-params.json"
Write-Host "3. See AZURE_DEPLOYMENT.md for full instructions"
Write-Host ""
Write-Host "Registry URL: $registryUrl" -ForegroundColor Yellow
Write-Host "Resource Group: $resourceGroup" -ForegroundColor Yellow
Write-Host "Location: $location" -ForegroundColor Yellow
Write-Host ""
