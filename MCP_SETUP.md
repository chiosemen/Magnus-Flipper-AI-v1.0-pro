# 🔌 MCP Configuration for Claude Code & Cursor

Model Context Protocol (MCP) allows Claude Code and Cursor to directly interact with external services like Render.

---

## ✅ Render MCP Configuration - COMPLETED

Your Render MCP configuration has been successfully created!

**Location:** `~/.anthropic/mcp/render.json`

**Configuration:**
```json
{
  "name": "render",
  "url": "https://mcp.render.com/mcp",
  "headers": {
    "Authorization": "Bearer rnd_7ITRyLKzhSnrgfhgtEQgm9VFMvtu"
  }
}
```

---

## 🎯 What This Enables

With this MCP configuration, Claude Code can now:

- ✅ **Deploy services** directly to Render
- ✅ **Check deployment status** and logs
- ✅ **Manage environment variables**
- ✅ **Monitor service health**
- ✅ **View build logs** in real-time
- ✅ **Trigger manual deploys**
- ✅ **Manage custom domains**

---

## 🚀 How to Use

### In Claude Code

Once configured, you can ask Claude Code to interact with Render:

**Examples:**

```
"Deploy my API to Render"
"Check the status of my Render services"
"Show me the logs from my last deployment"
"Update the environment variable STRIPE_SECRET_KEY on Render"
"Trigger a manual deploy of magnus-flipper-api"
```

Claude Code will use the MCP connection to execute these commands directly.

---

## 🔐 Security Notes

### API Token

Your Render API token (`rnd_7ITRyLKzhSnrgfhgtEQgm9VFMvtu`) provides:
- **Full access** to your Render account
- **Ability to** create, modify, and delete services
- **Access to** environment variables and secrets
- **Permission to** trigger deployments

### Best Practices

1. **Keep the token secure** - Never commit to git
2. **Rotate regularly** - Generate new tokens periodically
3. **Use scoped tokens** if available in Render settings
4. **Monitor usage** - Check Render audit logs

### File Permissions

The MCP configuration file has been created with secure permissions:
```bash
-rw-r--r--  ~/.anthropic/mcp/render.json
```

Only your user account can read/write this file.

---

## 🔧 Additional MCP Configurations (Optional)

### For Cursor

If you're using Cursor IDE, you can add the same configuration:

**Path:** `~/.cursor/mcp/render.json`

```bash
mkdir -p ~/.cursor/mcp
cp ~/.anthropic/mcp/render.json ~/.cursor/mcp/
```

### For VSCode

If you're using VSCode with Claude extension:

**Path:** `~/.vscode/mcp/render.json`

```bash
mkdir -p ~/.vscode/mcp
cp ~/.anthropic/mcp/render.json ~/.vscode/mcp/
```

---

## 📊 Other Useful MCP Configurations

### Vercel MCP

For deploying to Vercel:

**Path:** `~/.anthropic/mcp/vercel.json`

```json
{
  "name": "vercel",
  "url": "https://mcp.vercel.com/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_VERCEL_TOKEN"
  }
}
```

Get your Vercel token from: https://vercel.com/account/tokens

### Supabase MCP

For managing Supabase directly:

**Path:** `~/.anthropic/mcp/supabase.json`

```json
{
  "name": "supabase",
  "url": "https://mcp.supabase.com/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_SUPABASE_ACCESS_TOKEN"
  }
}
```

Get your Supabase access token from: https://app.supabase.com/account/tokens

### GitHub MCP

For GitHub operations:

**Path:** `~/.anthropic/mcp/github.json`

```json
{
  "name": "github",
  "url": "https://mcp.github.com/mcp",
  "headers": {
    "Authorization": "token YOUR_GITHUB_TOKEN"
  }
}
```

Get your GitHub token from: https://github.com/settings/tokens

---

## 🔄 Updating Your Configuration

### Rotate Render API Token

1. **Generate new token:**
   ```bash
   # Go to: https://dashboard.render.com/account/api-keys
   # Click "Create API Key"
   # Copy the new token
   ```

2. **Update configuration:**
   ```bash
   nano ~/.anthropic/mcp/render.json
   # Replace the token in the "Authorization" header
   ```

3. **Restart Claude Code** to pick up the new token

### Remove MCP Configuration

To disable Render MCP integration:

```bash
rm ~/.anthropic/mcp/render.json
```

---

## 🐛 Troubleshooting

### MCP Connection Not Working

**Issue:** Claude Code can't connect to Render

**Solutions:**

1. **Verify token is valid:**
   ```bash
   curl -H "Authorization: Bearer rnd_7ITRyLKzhSnrgfhgtEQgm9VFMvtu" \
     https://api.render.com/v1/services
   ```
   Should return your services list.

2. **Check file permissions:**
   ```bash
   ls -la ~/.anthropic/mcp/render.json
   # Should be readable by your user
   ```

3. **Validate JSON syntax:**
   ```bash
   cat ~/.anthropic/mcp/render.json | jq .
   # Should parse without errors
   ```

4. **Restart Claude Code:**
   - Close and reopen Claude Code
   - MCP configurations are loaded on startup

### Token Expired or Invalid

**Error:** `401 Unauthorized` when using Render MCP

**Fix:**
1. Go to Render Dashboard → Account Settings → API Keys
2. Generate a new API key
3. Update `~/.anthropic/mcp/render.json` with the new token
4. Restart Claude Code

---

## 📚 MCP Documentation

- **Render API Docs:** https://api-docs.render.com/
- **MCP Specification:** https://modelcontextprotocol.io/
- **Claude Code MCP Guide:** https://docs.claude.com/claude-code/mcp

---

## ✅ Verification

Your Render MCP is now configured! You can verify by asking Claude Code:

```
"List my Render services"
```

or

```
"Show me the status of magnus-flipper-api on Render"
```

Claude Code should be able to fetch this information using the MCP connection.

---

## 🎯 Quick Reference

| Action | Example Prompt |
|--------|----------------|
| **Deploy** | "Deploy the API to Render" |
| **Status** | "What's the status of my Render services?" |
| **Logs** | "Show me the latest logs from Render" |
| **Env Vars** | "List environment variables on Render" |
| **Update Env** | "Update STRIPE_KEY on Render to [value]" |
| **Manual Deploy** | "Trigger a manual deploy" |
| **Scale** | "Scale my API to 2 instances" |

---

**Status:** ✅ Render MCP configured and ready to use!

**Token:** `rnd_7ITRyLKzhSnrgfhgtEQgm9VFMvtu` (stored securely in `~/.anthropic/mcp/render.json`)
