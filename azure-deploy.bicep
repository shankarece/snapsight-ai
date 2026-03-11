param location string = resourceGroup().location
param appName string = 'snapsight-ai'
param environment string = 'prod'
param containerRegistryUrl string
param backendImageTag string = 'latest'
param frontendImageTag string = 'latest'

// Variables
var resourceGroupName = resourceGroup().name
var appServicePlanName = '${appName}-${environment}-plan'
var backendAppName = '${appName}-${environment}-backend'
var frontendAppName = '${appName}-${environment}-frontend'
var apiConnectionString = 'Server=tcp:${sqlServer.name}.database.windows.net,1433;Initial Catalog=${sqlDatabaseName};Encrypt=true;Connection Timeout=30;'

// SQL Server (if using Azure SQL)
param sqlServerName string = '${appName}${environment}sql'
param sqlAdminUser string
param sqlAdminPassword string
var sqlDatabaseName = 'snapsight'

// Azure SQL Server
resource sqlServer 'Microsoft.Sql/servers@2021-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminUser
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    publicNetworkAccess: 'Enabled'
  }
}

// Allow Azure services to access SQL
resource sqlServerFirewall 'Microsoft.Sql/servers/firewallRules@2021-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Database
resource sqlDatabase 'Microsoft.Sql/servers/databases@2021-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'B2'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

// Backend App Service (FastAPI)
resource backendAppService 'Microsoft.Web/sites@2021-02-01' = {
  name: backendAppName
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: containerRegistryUrl
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_USERNAME'
          value: ''
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_PASSWORD'
          value: ''
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_ENABLE_CI'
          value: 'true'
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: ''
        }
        {
          name: 'AZURE_OPENAI_KEY'
          value: ''
        }
        {
          name: 'AZURE_OPENAI_DEPLOYMENT'
          value: 'gpt-4o'
        }
        {
          name: 'AZURE_SQL_SERVER'
          value: '${sqlServer.name}.database.windows.net'
        }
        {
          name: 'AZURE_SQL_DATABASE'
          value: sqlDatabaseName
        }
        {
          name: 'AZURE_SQL_USERNAME'
          value: sqlAdminUser
        }
        {
          name: 'AZURE_SQL_PASSWORD'
          value: sqlAdminPassword
        }
      ]
      linuxFxVersion: 'DOCKER|${containerRegistryUrl}/snapsight-ai-backend:${backendImageTag}'
    }
    httpsOnly: true
  }
}

// Frontend Static Web App
resource frontendStaticWebApp 'Microsoft.Web/staticSites@2021-03-01' = {
  name: frontendAppName
  location: 'eastus' // Static Web Apps require specific regions
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    repositoryUrl: 'https://github.com/shankarece/snapsight-ai'
    branch: 'main'
    buildProperties: {
      appLocation: '/'
      apiLocation: 'api'
      outputLocation: 'frontend/build'
      appBuildCommand: 'npm run build'
      apiBuildCommand: 'npm ci && npm run build'
    }
  }
}

// Outputs
output backendUrl string = 'https://${backendAppService.properties.defaultHostName}'
output frontendUrl string = 'https://${frontendStaticWebApp.properties.defaultHostName}'
output sqlServerName string = sqlServer.name
output apiConnectionString string = apiConnectionString
