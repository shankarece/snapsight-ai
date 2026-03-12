param appName string
param location string = resourceGroup().location
param environmentName string = 'dev'
param backendImageUri string
param frontendImageUri string

param azureOpenaiEndpoint string
@secure()
param azureOpenaiKey string
param azureOpenaiDeployment string = 'gpt-4o'

param azureSqlServer string
param azureSqlDatabase string
param azureSqlUsername string
@secure()
param azureSqlPassword string

// Azure Container Registry (for storing Docker images)
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: '${replace(appName, '-', '')}acr'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
  }
}

// App Service Plan (Linux)
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

// Backend App Service
resource backendAppService 'Microsoft.Web/sites@2023-01-01' = {
  name: '${appName}-backend'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${backendImageUri}'
      alwaysOn: false
      http20Enabled: true
      appSettings: [
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://${acr.properties.loginServer}'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_USERNAME'
          value: listCredentials(acr.id, acr.apiVersion).username
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_PASSWORD'
          value: listCredentials(acr.id, acr.apiVersion).passwords[0].value
        }
        {
          name: 'WEBSITES_PORT'
          value: '8000'
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: azureOpenaiEndpoint
        }
        {
          name: 'AZURE_OPENAI_KEY'
          value: azureOpenaiKey
        }
        {
          name: 'AZURE_OPENAI_DEPLOYMENT'
          value: azureOpenaiDeployment
        }
        {
          name: 'AZURE_SQL_SERVER'
          value: azureSqlServer
        }
        {
          name: 'AZURE_SQL_DATABASE'
          value: azureSqlDatabase
        }
        {
          name: 'AZURE_SQL_USERNAME'
          value: azureSqlUsername
        }
        {
          name: 'AZURE_SQL_PASSWORD'
          value: azureSqlPassword
        }
      ]
    }
    httpsOnly: true
  }
}

// Frontend App Service
resource frontendAppService 'Microsoft.Web/sites@2023-01-01' = {
  name: '${appName}-frontend'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${frontendImageUri}'
      alwaysOn: false
      http20Enabled: true
      appSettings: [
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://${acr.properties.loginServer}'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_USERNAME'
          value: listCredentials(acr.id, acr.apiVersion).username
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_PASSWORD'
          value: listCredentials(acr.id, acr.apiVersion).passwords[0].value
        }
        {
          name: 'WEBSITES_PORT'
          value: '80'
        }
      ]
    }
    httpsOnly: true
  }
}

// Outputs
output backendAppServiceUrl string = 'https://${backendAppService.properties.defaultHostName}'
output frontendAppServiceUrl string = 'https://${frontendAppService.properties.defaultHostName}'
output acrLoginServer string = acr.properties.loginServer
