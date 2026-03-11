# SnapSight AI - Azure Deployment Quick Start

**Time Required**: ~30-45 minutes
**Cost**: ~$50-55/month (Basic tier)
**Prerequisites**: Azure subscription, Azure CLI, Docker

---

## ⚡ Quick Start (5 Easy Steps)

### **Step 1: Install Prerequisites (5 minutes)**

**Windows:**
```powershell
# Azure CLI
winget install Microsoft.AzureCLI

# Docker Desktop
winget install Docker.DockerDesktop

# Verify
az --version
docker --version
```

**macOS:**
```bash
brew install azure-cli
brew install docker
```

**Linux:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
# Docker: https://docs.docker.com/engine/install/
```

---

### **Step 2: Login to Azure (2 minutes)**

Open PowerShell/Terminal and run:
```bash
az login
az account show
```

A browser window will open - authenticate with your Azure account.

---

### **Step 3: Run Deployment Script (15 minutes)**

**On Windows, open PowerShell and run:**
```powershell
cd path\to\snapsight-ai
powershell -ExecutionPolicy Bypass -File deploy-to-azure.ps1
```

**On macOS/Linux, run:**
```bash
cd path/to/snapsight-ai
./deploy-to-azure.sh  # (you'll need to create this - see below)
```

This script will:
1. ✅ Check prerequisites
2. ✅ Create resource group
3. ✅ Create container registry
4. ✅ Build Docker images
5. ✅ Push images to Azure

---

### **Step 4: Deploy Infrastructure (10 minutes)**

After the script completes, run:

```bash
az deployment group create \
  --resource-group snapsight-ai-rg \
  --template-file azure-deploy.bicep \
  --parameters @azure-deploy-params.json
```

This deploys:
- ✅ App Service (backend)
- ✅ Static Web App (frontend)
- ✅ SQL Database
- ✅ Network configuration

---

### **Step 5: Verify Deployment (5 minutes)**

```bash
# Get backend URL
az webapp show --resource-group snapsight-ai-rg \
  --name snapsight-ai-prod-backend \
  --query defaultHostName -o tsv

# Test health
curl https://[backend-url]/health

# Should return:
# {"status":"healthy","database":"connected",...}
```

Get frontend URL:
```bash
az staticwebapp list --resource-group snapsight-ai-rg \
  --query [0].defaultHostname -o tsv
```

---

## 🔍 Verify Everything Works

### Check Backend
```bash
# Health check
curl https://[backend-url]/health

# Test query
curl -X POST https://[backend-url]/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Show revenue by region"}'
```

### Check Frontend
Open in browser:
```
https://[frontend-url]
```

You should see:
- ✅ SnapSight AI homepage
- ✅ Ask tab active
- ✅ Search bar visible
- ✅ No console errors (F12)

---

## 📊 What Gets Created in Azure

| Resource | Type | Cost/Month |
|----------|------|-----------|
| App Service Plan (B2) | Compute | $15 |
| App Service (Backend) | Hosting | (included) |
| Static Web App | Hosting | $10-20 |
| Azure SQL (Standard) | Database | $15 |
| Container Registry | Storage | $5 |
| **TOTAL** | | **$45-55** |

All on pay-per-use billing. You can scale down to Free tier to test.

---

## 🆘 Troubleshooting

### "Azure CLI not found"
```powershell
# Reinstall Azure CLI
winget uninstall Microsoft.AzureCLI
winget install Microsoft.AzureCLI

# Restart PowerShell
```

### "Docker not running"
1. Open Docker Desktop application
2. Wait for it to fully start (2-3 minutes)
3. Retry docker command

### "Login failed"
```bash
# Clear cached credentials
az logout
az login --force-device-code
```

### "SQL Database can't connect"
Check that:
1. Firewall rule allows Azure services: ✅ (added in Bicep)
2. Connection string is correct in App Settings
3. SQL server is running

### "Images won't push to registry"
```bash
# Clear Docker authentication
docker logout
az acr login --name snapsightai
docker push snapsightai.azurecr.io/snapsight-ai-backend:latest
```

---

## 📝 Configuration Files

**Already created for you:**
- ✅ `Dockerfile.backend` - Python/FastAPI container
- ✅ `Dockerfile.frontend` - React/Nginx container
- ✅ `nginx.conf` - Web server config
- ✅ `azure-deploy.bicep` - Infrastructure template
- ✅ `azure-deploy-params.json` - Deployment parameters
- ✅ `deploy-to-azure.ps1` - PowerShell deployment script

**You need to:**
1. Edit `azure-deploy-params.json` to change the SQL password
2. Have Azure subscription ready
3. Have Azure CLI and Docker installed

---

## ✅ After Deployment

Once deployed, you have:
1. **Live backend API** at `https://snapsight-ai-prod-backend.azurewebsites.net`
2. **Live frontend** at `https://snapsight-ai-prod-frontend.azurewebsites.net`
3. **SQL Database** for storing data
4. **Container Registry** with your Docker images

You can now:
- ✅ Share the URL with others
- ✅ Demonstrate to hackathon judges
- ✅ Monitor performance in Azure Portal
- ✅ Scale up if needed

---

## 💰 Cost Management

To reduce costs:

**Option 1: Stop resources when not using**
```bash
# Stop backend
az webapp stop --resource-group snapsight-ai-rg \
  --name snapsight-ai-prod-backend

# Stop SQL
az sql db pause --resource-group snapsight-ai-rg \
  --server snapsight-sql-prod \
  --name snapsight
```

**Option 2: Delete everything (when done with hackathon)**
```bash
az group delete --name snapsight-ai-rg --yes
# This deletes ALL resources and stops all charges
```

**Option 3: Use free tier for testing**
- Change `B2` to `F1` (Free) in azure-deploy.bicep
- Change SQL to `Free` tier
- Redeploy

---

## 🎯 Next Steps

1. ✅ Install prerequisites (Azure CLI, Docker)
2. ✅ Run `deploy-to-azure.ps1`
3. ✅ Run Bicep deployment
4. ✅ Verify health check
5. ✅ Test in browser
6. ✅ Share URLs with hackathon judges
7. ✅ Submit to hackathon!

---

## 📞 Support

If something fails:
1. Check the error message carefully
2. Look in troubleshooting section above
3. Check Azure Portal for resource status
4. Review `AZURE_DEPLOYMENT.md` for full guide

**Repository**: https://github.com/shankarece/snapsight-ai
**Issues**: Open GitHub issue if needed

---

**Ready? Let's deploy! 🚀**

Run this first:
```powershell
az login
```

Then:
```powershell
powershell -ExecutionPolicy Bypass -File deploy-to-azure.ps1
```

Come back when the script completes!
