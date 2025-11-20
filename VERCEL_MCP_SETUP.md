# ⚙️ Vercel MCP Setup — Magnus Flipper AI

This configuration enables Claude Code, Cursor, and DeepSeek agents to directly manage your **Vercel projects and deployments** via the Model Context Protocol.

---

## 🧩 1. Configuration File

Place the following file in your MCP directory:

**Location:** `~/.anthropic/mcp/vercel.mcp.json`

```json
{
  "schema_version": "v1",
  "name": "Vercel",
  "description": "Custom MCP integration for Vercel API — manages deployments, logs, and environment for Magnus Flipper AI.",
  "api": {
    "base_url": "https://api.vercel.com",
    "auth": {
      "type": "bearer",
      "token": "VERCEL_API_TOKEN"
    }
  },
  "tools": [
    {
      "name": "list_projects",
      "description": "List all projects in your Vercel account",
      "method": "GET",
      "path": "/v9/projects"
    },
    {
      "name": "get_project",
      "description": "Retrieve details for a specific project by ID or name",
      "method": "GET",
      "path": "/v9/projects/{projectIdOrName}"
    },
    {
      "name": "list_deployments",
      "description": "List all deployments for a given project",
      "method": "GET",
      "path": "/v13/deployments?projectId={projectIdOrName}"
    },
    {
      "name": "get_deployment",
      "description": "Get detailed info for a specific deployment",
      "method": "GET",
      "path": "/v13/deployments/{deploymentId}"
    },
    {
      "name": "trigger_deploy",
      "description": "Trigger a new deployment for a project",
      "method": "POST",
      "path": "/v13/deployments",
      "body": {
        "name": "{projectName}",
        "gitSource": {
          "type": "github",
          "repoId": "{repoId}",
          "branch": "main"
        }
      }
    },
    {
      "name": "get_logs",
      "description": "Fetch build or runtime logs for a specific deployment",
      "method": "GET",
      "path": "/v2/deployments/{deploymentId}/events"
    },
    {
      "name": "get_env_vars",
      "description": "List all environment variables for a given project",
      "method": "GET",
      "path": "/v9/projects/{projectIdOrName}/env"
    },
    {
      "name": "set_env_var",
      "description": "Create or update an environment variable in a project",
      "method": "POST",
      "path": "/v9/projects/{projectIdOrName}/env",
      "body": {
        "key": "{key}",
        "value": "{value}",
        "target": ["production"]
      }
    }
  ]
}
```

---

## 🔑 2. Getting Your Vercel API Token

1. **Navigate to Vercel Account Settings:**
   - Visit: https://vercel.com/account/tokens

2. **Create a New Token:**
   - Click **"Create Token"**
   - Name: `MCP-Magnus-Flipper-AI`
   - Scope: **Full Access** (or limit to specific teams/projects)
   - Expiration: Choose based on your security policy

3. **Copy the Token:**
   - Save it securely — you won't be able to see it again

4. **Update the MCP Configuration:**
   ```bash
   # Edit the configuration file
   nano ~/.anthropic/mcp/vercel.mcp.json

   # Replace "VERCEL_API_TOKEN" with your actual token
   # Example:
   # "token": "vercel_abc123xyz456..."
   ```

---

## 🔄 3. Activate the MCP Configuration

After placing the file and adding your token:

### For Claude Code:
```bash
# Restart Claude Code to load the new MCP server
# The Vercel tools will automatically be available
```

### For Cursor:
```bash
# Cursor may auto-detect MCP configurations in ~/.anthropic/mcp/
# If not, restart the editor
```

### Verify Installation:
Once restarted, you can test by asking:
```
"List all my Vercel projects"
```

The agent should invoke the `list_projects` tool and return your projects.

---

## 🛠️ 4. Available Tools

Once activated, you'll have access to these Vercel management tools:

### Project Management
- **list_projects** — View all Vercel projects
- **get_project** — Get detailed info for a specific project

### Deployment Management
- **list_deployments** — List all deployments for a project
- **get_deployment** — Get details for a specific deployment
- **trigger_deploy** — Trigger a new deployment from GitHub

### Logs & Debugging
- **get_logs** — Fetch build or runtime logs for debugging

### Environment Variables
- **get_env_vars** — List all environment variables
- **set_env_var** — Create or update environment variables

---

## 📋 5. Example Usage

### List All Projects
```
"Show me all my Vercel projects"
```

### Deploy from Main Branch
```
"Trigger a deployment for the Magnus Flipper web project from the main branch"
```

### Check Deployment Status
```
"Get the latest deployment status for project Magnus-Flipper-Web"
```

### View Build Logs
```
"Show me the build logs for deployment dpl_abc123"
```

### Manage Environment Variables
```
"List all environment variables for the Magnus Flipper API project"
"Set NEXT_PUBLIC_API_URL to https://api.flipperagents.com for production"
```

---

## 🔒 6. Security Best Practices

1. **Token Storage:**
   - Never commit the token to version control
   - Use environment variables if sharing MCP configs
   - Rotate tokens periodically

2. **Scoped Access:**
   - Create tokens with minimum required permissions
   - Use team-scoped tokens for shared projects

3. **Audit Logs:**
   - Regularly review Vercel audit logs for API usage
   - Monitor for unexpected deployment triggers

---

## 🚨 7. Troubleshooting

### MCP Tools Not Showing Up
```bash
# Check if the file exists
ls -la ~/.anthropic/mcp/vercel.mcp.json

# Verify JSON syntax
cat ~/.anthropic/mcp/vercel.mcp.json | jq .

# Restart your editor/Claude Code
```

### Authentication Errors
```bash
# Verify your token is valid
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.vercel.com/v9/projects

# If 401 Unauthorized, generate a new token
```

### Tool Invocation Failures
- Check that project names/IDs are correct
- Ensure the token has appropriate permissions
- Review Vercel API rate limits (150 req/min for hobby, 600 for pro)

---

## 📚 8. Additional Resources

- **Vercel API Docs:** https://vercel.com/docs/rest-api
- **MCP Specification:** https://modelcontextprotocol.io
- **Magnus Flipper AI Docs:** See [README.md](./README.md)

---

## ✅ Current Setup Status

**MCP Configuration Files:**
- ✅ `~/.anthropic/mcp/vercel.mcp.json` — Vercel API integration
- ✅ `~/.anthropic/mcp/vercel.json` — Backup/alternate config
- ✅ `~/.anthropic/mcp/render.json` — Render API integration (already configured)

**Next Steps:**
1. Add your Vercel API token to the configuration
2. Restart Claude Code/Cursor
3. Test with `"List all my Vercel projects"`
4. Use for automated deployments and monitoring

---

**Generated for Magnus Flipper AI v1.0**
Last Updated: 2025-11-08
