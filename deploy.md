# Windows Server Deployment Guide

Follow these steps to host the Evaluation Workspace on a Windows Server instance using IIS to serve the production build.

## Prerequisites

- Windows Server 2019 or later with administrator access
- Latest **Windows Updates** applied
- **Node.js 18+** installed (https://nodejs.org/) and added to the system `PATH`
- **Git** installed (https://git-scm.com/download/win)
- **Internet Information Services (IIS)** with the following components:
  - Web Server
  - Static Content
  - Default Document
  - URL Rewrite Module (install from https://www.iis.net/downloads/microsoft/url-rewrite)

## 1. Fetch the source code

```powershell
cd C:\inetpub\wwwroot
git clone <REPOSITORY_URL> evaluation-workspace
cd evaluation-workspace
```

Replace `<REPOSITORY_URL>` with the HTTPS URL of your repository.

## 2. Install dependencies

```powershell
npm install
```

Confirm the command completes without errors.

## 3. Build the production bundle

```powershell
npm run build
```

The compiled assets will be generated inside the `dist` folder.

## 4. Configure IIS site

1. Open **Internet Information Services (IIS) Manager**.
2. Right-click **Sites** → **Add Website…**
   - **Site name:** `EvaluationWorkspace`
   - **Physical path:** `C:\inetpub\wwwroot\evaluation-workspace\dist`
   - **Binding:** choose desired IP/hostname, set port (e.g. 80 or 443 with SSL)
3. Click **OK** to create the site.

### Default document

Ensure `index.html` is listed under **Default Document** for the new site. Add it if missing.

## 5. Configure SPA routing

Single Page Application routing requires serving `index.html` for unknown paths.

1. In the website root (`dist`), create a file named `web.config` with the content below:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReactRoutes" stopProcessing="true">
          <match url="^(.*)$" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

2. Confirm the file is saved with UTF-8 encoding.

## 6. Restart IIS site

```powershell
iisreset
```

Alternatively, inside IIS Manager, select the site and choose **Restart** in the Actions pane.

## 7. Verify deployment

1. Browse to `http://<server-hostname>/` in a browser.
2. Confirm the Evaluation Workspace loads and navigation works.
3. Test deep links such as `/evaluate` and `/reports`; they should resolve via the rewrite rule.

## 8. Optional: HTTPS & hardening

- Bind an SSL certificate under **Bindings…** for HTTPS traffic.
- Enable Windows Firewall rules for the selected port(s).
- Configure automatic deployment by scripting `git pull`, `npm install`, and `npm run build` in a scheduled task.

## 9. Updating the app

When pushing new code:

```powershell
cd C:\inetpub\wwwroot\evaluation-workspace
git pull
npm install
npm run build
iisreset
```

The site will serve the refreshed build instantly after IIS restarts.
