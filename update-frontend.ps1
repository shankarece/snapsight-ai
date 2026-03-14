az acr build --registry snapsightaiacr --image snapsight-frontend:v3 --build-arg REACT_APP_API_BASE=https://snapsight-ai-backend.azurewebsites.net ./frontend
$creds = az acr credential show --name snapsightaiacr | ConvertFrom-Json
az webapp config container set --resource-group snapsight-ai-rg --name snapsight-ai-frontend --container-image-name snapsightaiacr.azurecr.io/snapsight-frontend:v3 --container-registry-url https://snapsightaiacr.azurecr.io --container-registry-user $creds.username --container-registry-password $creds.passwords[0].value
az webapp restart --resource-group snapsight-ai-rg --name snapsight-ai-frontend
