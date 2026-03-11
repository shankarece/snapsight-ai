# SnapSight AI - Azure Deployment Guide

Deploy SnapSight AI to Azure cloud with full CI/CD integration.

---

## Prerequisites

1. **Azure Subscription** - Free or paid
2. **Azure CLI** installed (`az --version`)
3. **Docker** installed locally
4. **GitHub Account** with repo access
5. Environment variables set up in `backend/.env`:
   - `AZURE_OPENAI_ENDPOINT`
   - `AZURE_OPENAI_KEY`
   - `AZURE_OPENAI_DEPLOYMENT`
   - `AZURE_SQL_*` (will be provided by deployment)

---

## Step 1: Prepare Azure Resources (5 minutes)

### 1.1 Login to Azure
```bash
az login
az account show
```

### 1.2 Create Resource Group
```bash
az group create \
  --name snapsight-ai-rg \
  --location eastus
```

### 1.3 Create Container Registry
```bash
az acr create \
  --resource-group snapsight-ai-rg \
  --name snapsightai \
  --sku Basic \
  --admin-enabled true

# Get credentials
az acr credential show \
  --name snapsightai \
  --resource-group snapsight-ai-rg
```

Save the login server URL and credentials - you'll need them next.

---

## Step 2: Build & Push Docker Images (10 minutes)

### 2.1 Build Backend Image
```bash
docker build \
  -f Dockerfile.backend \
  -t snapsightai.azurecr.io/snapsight-ai-backend:latest \
  .

docker build \
  -f Dockerfile.frontend \
  -t snapsightai.azurecr.io/snapsight-ai-frontend:latest \
  .
```

### 2.2 Login to Azure Container Registry
```bash
az acr login --name snapsightai
```

### 2.3 Push Images
```bash
docker push snapsightai.azurecr.io/snapsight-ai-backend:latest
docker push snapsightai.azurecr.io/snapsight-ai-frontend:latest

# Verify
az acr repository list --name snapsightai
```

---

## Step 3: Deploy Infrastructure with Bicep (10 minutes)

### 3.1 Prepare Parameters
Create `azure-deploy-params.json`:
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "location": {
      "value": "eastus"
    },
    "appName": {
      "value": "snapsight-ai"
    },
    "environment": {
      "value": "prod"
    },
    "containerRegistryUrl": {
      "value": "snapsightai.azurecr.io"
    },
    "backendImageTag": {
      "value": "latest"
    },
    "frontendImageTag": {
      "value": "latest"
    },
    "sqlServerName": {
      "value": "snapsight-sql-prod"
    },
    "sqlAdminUser": {
      "value": "sqladmin"
    },
    "sqlAdminPassword": {
      "value": "YourSecurePassword123!"
    }
  }
}
```

### 3.2 Deploy Bicep Template
```bash
az deployment group create \
  --resource-group snapsight-ai-rg \
  --template-file azure-deploy.bicep \
  --parameters @azure-deploy-params.json
```

### 3.3 Get Deployment Outputs
```bash
az deployment group show \
  --resource-group snapsight-ai-rg \
  --name azure-deploy \
  --query properties.outputs
```

Note the:
- **Backend URL** (e.g., `https://snapsight-ai-prod-backend.azurewebsites.net`)
- **Frontend URL** (e.g., `https://snapsight-ai-prod-frontend.azurewebsites.net`)
- **SQL Server Name**

---

## Step 4: Configure Backend Environment Variables

### 4.1 Set App Settings
```bash
az webapp config appsettings set \
  --resource-group snapsight-ai-rg \
  --name snapsight-ai-prod-backend \
  --settings \
    AZURE_OPENAI_ENDPOINT="https://your-openai.openai.azure.com/" \
    AZURE_OPENAI_KEY="your-key-here" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4o" \
    AZURE_SQL_SERVER="snapsight-sql-prod.database.windows.net" \
    AZURE_SQL_DATABASE="snapsight" \
    AZURE_SQL_USERNAME="sqladmin" \
    AZURE_SQL_PASSWORD="YourSecurePassword123!" \
    DOCKER_REGISTRY_SERVER_URL="snapsightai.azurecr.io" \
    DOCKER_REGISTRY_SERVER_USERNAME="snapsightai" \
    DOCKER_REGISTRY_SERVER_PASSWORD="your-registry-password"
```

### 4.2 Initialize Database
```bash
# Connect to Azure SQL
sqlcmd -S snapsight-sql-prod.database.windows.net \
  -U sqladmin \
  -P "YourSecurePassword123!" \
  -d snapsight \
  -i backend/database/init.sql
```

Or seed with sample data:
```bash
python backend/database/seed_data.py
```

---

## Step 5: Configure Frontend (Optional - for Static Web Apps)

If using Azure Static Web Apps instead of App Service:

### 5.1 Link GitHub Repository
```bash
az staticwebapp create \
  --name snapsight-ai-prod-frontend \
  --resource-group snapsight-ai-rg \
  --source https://github.com/shankarece/snapsight-ai \
  --branch main \
  --api-location api \
  --app-location frontend/build \
  --sku Standard
```

### 5.2 Configure Environment Variables
In Azure Portal:
1. Go to Static Web App resource
2. Settings → Configuration
3. Set `REACT_APP_API_BASE` to your backend URL:
   ```
   REACT_APP_API_BASE=https://snapsight-ai-prod-backend.azurewebsites.net
   ```

---

## Step 6: Test Deployment

### 6.1 Health Check
```bash
curl https://snapsight-ai-prod-backend.azurewebsites.net/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "message": "SnapSight AI is running!"
}
```

### 6.2 Test API Endpoint
```bash
curl -X POST https://snapsight-ai-prod-backend.azurewebsites.net/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Show revenue by region"}'
```

### 6.3 Test Frontend
Open in browser: `https://snapsight-ai-prod-frontend.azurewebsites.net`

---

## Step 7: Enable CI/CD (Optional)

### 7.1 GitHub Actions for Backend
Create `.github/workflows/deploy-backend.yml`:
```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'Dockerfile.backend'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build and push backend image
        run: |
          docker build -f Dockerfile.backend -t snapsightai.azurecr.io/snapsight-ai-backend:latest .
          docker login -u ${{ secrets.AZURE_REGISTRY_USERNAME }} -p ${{ secrets.AZURE_REGISTRY_PASSWORD }} snapsightai.azurecr.io
          docker push snapsightai.azurecr.io/snapsight-ai-backend:latest

      - name: Deploy to App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'snapsight-ai-prod-backend'
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          images: 'snapsightai.azurecr.io/snapsight-ai-backend:latest'
```

### 7.2 Add Secrets to GitHub
Go to repository Settings → Secrets:
- `AZURE_REGISTRY_USERNAME`
- `AZURE_REGISTRY_PASSWORD`
- `AZURE_PUBLISH_PROFILE`

---

## Scaling & Monitoring

### Increase App Service Tier
```bash
az appservice plan update \
  --name snapsight-ai-prod-plan \
  --resource-group snapsight-ai-rg \
  --sku S1  # Standard tier
```

### Monitor Logs
```bash
az webapp log tail \
  --resource-group snapsight-ai-rg \
  --name snapsight-ai-prod-backend
```

### View Metrics
```bash
az monitor metrics list \
  --resource snapsight-ai-prod-backend \
  --resource-group snapsight-ai-rg \
  --metric-names Requests,HttpResponseTime
```

---

## Cost Estimation

| Resource | SKU | Cost/Month |
|----------|-----|-----------|
| App Service Plan (B2) | Basic | $15 |
| Container Registry | Basic | $5 |
| Azure SQL Database | Standard | $15 |
| Static Web Apps | Standard | $10-20 |
| **Total** | | **~$50-55** |

(Prices vary by region. Optimize with Reserved Instances for production.)

---

## Troubleshooting

### Backend won't start
1. Check logs: `az webapp log tail --resource-group snapsight-ai-rg --name snapsight-ai-prod-backend`
2. Verify environment variables are set correctly
3. Ensure database connection string is valid

### Frontend can't reach backend
1. Verify `REACT_APP_API_BASE` is set to backend URL
2. Check CORS settings on backend
3. Ensure both services are in the same resource group

### Database connection fails
1. Check SQL firewall rules allow Azure services
2. Verify credentials in App Settings
3. Test connection with: `sqlcmd -S server.database.windows.net -U user -P password -d snapsight`

---

## Post-Deployment Checklist

- [ ] Health check passes
- [ ] Frontend loads without errors
- [ ] Can execute sample queries
- [ ] Cross-filtering works
- [ ] Follow-up questions work
- [ ] No console errors (F12)
- [ ] Responsive on mobile
- [ ] Database backups configured
- [ ] Monitoring/alerts set up
- [ ] Security review complete (API keys, CORS, etc.)

---

## Next Steps

1. **Add GitHub Copilot Features** (see COPILOT_INTEGRATION.md)
2. **Setup Azure Agent Framework** (optional, advanced)
3. **Configure Azure DevOps for additional CI/CD**
4. **Optimize costs with Reserved Instances**

---

**Need Help?**
- Azure Docs: https://docs.microsoft.com/azure/
- SnapSight AI README: ../README.md
- Issues: Open GitHub issue at https://github.com/shankarece/snapsight-ai
