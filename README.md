# Teams Scenario Tab App (No Bot, No Copilot Dependency)

This repo is a tab-only Teams app:

- Always-visible personal tab
- Popup opens from tab button
- Uses your existing Scenario API backend
- No bot password required

## Files

- `src/index.js`: Express server and proxy endpoints
- `src/public/tab/index.html`: tab UI with popup button
- `src/public/dialog/scenario.html`: popup page (inputs + run + raw/output JSON)
- `appPackage/manifest.json`: Teams app manifest template
- `env/.env.dev.example`: env template

## 1) Prerequisites

1. Git: https://git-scm.com/download/win
2. Node.js 20+: https://nodejs.org/
3. Microsoft Teams desktop app
4. VS Code (optional): https://code.visualstudio.com/

Verify:

```powershell
git --version
node -v
npm -v
```

## 2) Setup

```powershell
npm install
Copy-Item env\.env.dev.example env\.env.dev
```

Edit `env/.env.dev`:

- `PUBLIC_BASE_URL`: URL where this app is reachable by Teams
- `SCENARIO_API_BASE`: existing backend base URL
- `SCENARIO_API_DOMAIN`: domain-only value of `SCENARIO_API_BASE`

## 3) Local Browser Test

```powershell
npm run dev
```

Open:

- `http://localhost:3978/tab/index.html`

## 4) Publish Server (for Teams)

Teams cannot use `localhost`, so host this app on a public URL (Container App/App Service/etc).

After hosting, update:

- `PUBLIC_BASE_URL=https://<your-public-host>`

### Azure Container App (recommended)

Example commands:

```powershell
az login
az account set --subscription 1367aba5-16bd-4981-a06b-6c748108f95b

az acr login --name pptagentregistryinternal
docker build -t pptagentregistryinternal.azurecr.io/teams-scenario-tab:v1 .
docker push pptagentregistryinternal.azurecr.io/teams-scenario-tab:v1

$acrUser = az acr credential show -n pptagentregistryinternal --query username -o tsv
$acrPass = az acr credential show -n pptagentregistryinternal --query passwords[0].value -o tsv

az containerapp create `
  --name teams-scenario-tab-api `
  --resource-group rg-swire `
  --environment pptagent-aca-env `
  --image pptagentregistryinternal.azurecr.io/teams-scenario-tab:v1 `
  --ingress external `
  --target-port 3978 `
  --registry-server pptagentregistryinternal.azurecr.io `
  --registry-username $acrUser `
  --registry-password $acrPass `
  --env-vars SCENARIO_API_BASE=https://da-adaptive-card-dialog-api.salmonbush-d5bb9b4c.eastus.azurecontainerapps.io

$fqdn = az containerapp show --name teams-scenario-tab-api --resource-group rg-swire --query properties.configuration.ingress.fqdn -o tsv
$fqdn
```

Set in `env/.env.dev` for local consistency:

- `PUBLIC_BASE_URL=https://$fqdn`
- `SCENARIO_API_DOMAIN=da-adaptive-card-dialog-api.salmonbush-d5bb9b4c.eastus.azurecontainerapps.io`

## 5) Prepare Manifest

In `appPackage/manifest.json`, replace placeholders:

- `{{TEAMS_APP_ID}}` -> new GUID
- `{{PUBLIC_BASE_URL}}` -> your hosted URL
- `{{PUBLIC_BASE_DOMAIN}}` -> hosted domain only
- `{{SCENARIO_API_DOMAIN}}` -> scenario API domain only

Create a GUID:

```powershell
[guid]::NewGuid()
```

If your hosted URL is `https://teams-scenario-tab-api.xxxxx.eastus.azurecontainerapps.io`, then:

- `{{PUBLIC_BASE_URL}}=https://teams-scenario-tab-api.xxxxx.eastus.azurecontainerapps.io`
- `{{PUBLIC_BASE_DOMAIN}}=teams-scenario-tab-api.xxxxx.eastus.azurecontainerapps.io`
- `{{SCENARIO_API_DOMAIN}}=da-adaptive-card-dialog-api.salmonbush-d5bb9b4c.eastus.azurecontainerapps.io`

## 6) Create Zip

```powershell
npm run zip:app
```

Output:

- `appPackage/build/appPackage.zip`

## 7) Upload to Teams

1. Teams -> Apps -> Manage your apps
2. Upload a custom app
3. Select `appPackage/build/appPackage.zip`
4. Open installed app

## 8) Usage

1. Open app personal tab
2. Click `Open Scenario Analysis`
3. Enter rows and click `Run (Post to Chat)` inside popup
4. Close popup and view latest results in tab preview

## 9) Important

- This app is tab-only and independent from your Copilot declarative agent repo.
- Deploying this app does not require bot credentials.

