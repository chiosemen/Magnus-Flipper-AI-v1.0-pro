const fs = require("fs");
const path = require("path");

module.exports = async () => {
  const platforms = {
    github: [
      "SUPABASE_DB_URL",
      "SUPABASE_STAGING_DB_URL",
      "AZURE_SUBSCRIPTION_ID",
      "AZURE_TENANT_ID",
      "AZURE_CLIENT_ID",
      "AZURE_CLIENT_SECRET",
      "VERCEL_TOKEN",
      "OPENAI_API_KEY",
      "GEMINI_API_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET"
    ],
    vercel: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_API_BASE_URL",
      "AI_GATEWAY_API_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "DATABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "CRON_SECRET"
    ],
    azure: [
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_DB_URL",
      "SUPABASE_URL",
      "REDIS_URL",
      "OPENAI_API_KEY",
      "GEMINI_API_KEY",
      "DATABASE_URL",
      "CRON_SECRET"
    ],
    render: [
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_DB_URL",
      "DATABASE_URL",
      "REDIS_URL",
      "OPENAI_API_KEY"
    ],
    expo: [
      "EXPO_PUBLIC_SUPABASE_URL",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      "EXPO_PUBLIC_API_URL",
      "EXPO_PUBLIC_ENV",
      "EXPO_PUBLIC_VERSION"
    ]
  };

  // Try to find .env files
  const envFiles = [
    ".env",
    ".env.production",
    ".env.local",
    "apps/web/.env.local",
    "apps/worker/.env"
  ];

  const vars = {};
  
  // Read from multiple potential .env files
  for (const envFile of envFiles) {
    const fullPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        const lines = content.split("\n");
        
        for (const line of lines) {
          const trimmed = line.trim();
          // Skip comments and empty lines
          if (!trimmed || trimmed.startsWith("#")) continue;
          
          if (trimmed.includes("=")) {
            const [k, ...rest] = trimmed.split("=");
            const key = k.trim();
            const value = rest.join("=").trim();
            
            // Remove quotes if present
            const cleanValue = value.replace(/^["']|["']$/g, "");
            
            if (key && cleanValue) {
              // Prefer production values, but allow override
              if (!vars[key] || envFile.includes("production")) {
                vars[key] = cleanValue;
              }
            }
          }
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
  }

  function createGithubCommands() {
    const commands = [];
    commands.push("# ===== GITHUB ACTIONS SECRETS =====\n");
    commands.push("# Set secrets using GitHub CLI (gh)\n");
    commands.push("# Prerequisites: gh auth login\n\n");
    
    platforms.github.forEach(key => {
      if (vars[key]) {
        // Escape special characters for shell
        const escapedValue = vars[key].replace(/"/g, '\\"');
        commands.push(`gh secret set ${key} --body "${escapedValue}"`);
      } else {
        commands.push(`# Missing: ${key}`);
        commands.push(`# gh secret set ${key} --body "YOUR_VALUE_HERE"`);
      }
    });
    
    return commands.join("\n");
  }

  function createVercelCommands() {
    const commands = [];
    commands.push("# ===== VERCEL ENVIRONMENT VARIABLES =====\n");
    commands.push("# Set env vars using Vercel CLI\n");
    commands.push("# Prerequisites: vercel login\n");
    commands.push("# Note: Use 'production', 'preview', or 'development' as environment\n\n");
    
    const environments = ["production", "preview", "development"];
    
    platforms.vercel.forEach(key => {
      if (vars[key]) {
        const escapedValue = vars[key].replace(/"/g, '\\"');
        environments.forEach(env => {
          commands.push(`vercel env add ${key} ${env} <<< "${escapedValue}"`);
        });
      } else {
        commands.push(`# Missing: ${key}`);
        commands.push(`# vercel env add ${key} production <<< "YOUR_VALUE_HERE"`);
      }
    });
    
    return commands.join("\n");
  }

  function createAzureCommands() {
    const commands = [];
    commands.push("# ===== AZURE CONTAINER APP SECRETS =====\n");
    commands.push("# Set secrets for Azure Container Apps\n");
    commands.push("# Prerequisites: az login\n");
    commands.push("# Update RESOURCE_GROUP and APP_NAME as needed\n\n");
    
    commands.push("RESOURCE_GROUP=\"magnus-flipper-prod\"\n");
    commands.push("APP_NAME=\"flipper-workers\"\n\n");
    
    platforms.azure.forEach(key => {
      if (vars[key]) {
        const escapedValue = vars[key].replace(/"/g, '\\"');
        commands.push(`az containerapp secret set --name $APP_NAME --resource-group $RESOURCE_GROUP --secrets ${key}="${escapedValue}"`);
      } else {
        commands.push(`# Missing: ${key}`);
        commands.push(`# az containerapp secret set --name $APP_NAME --resource-group $RESOURCE_GROUP --secrets ${key}="YOUR_VALUE_HERE"`);
      }
    });
    
    return commands.join("\n");
  }

  function createRenderCommands() {
    const commands = [];
    commands.push("# ===== RENDER SERVICE ENVIRONMENT =====\n");
    commands.push("# Set env vars via Render Dashboard or CLI\n");
    commands.push("# Dashboard: https://dashboard.render.com → Your Service → Environment\n");
    commands.push("# Or use Render CLI:\n\n");
    
    platforms.render.forEach(key => {
      if (vars[key]) {
        const escapedValue = vars[key].replace(/"/g, '\\"');
        commands.push(`# render env:set ${key}="${escapedValue}"`);
        commands.push(`render env:set ${key} "${escapedValue}"`);
      } else {
        commands.push(`# Missing: ${key}`);
        commands.push(`# render env:set ${key} "YOUR_VALUE_HERE"`);
      }
    });
    
    return commands.join("\n");
  }

  function createExpoCommands() {
    const commands = [];
    commands.push("# ===== EXPO EAS SECRETS =====\n");
    commands.push("# Set secrets using EAS CLI\n");
    commands.push("# Prerequisites: eas login\n");
    commands.push("# Note: Run from apps/mobile directory\n\n");
    
    commands.push("cd apps/mobile\n\n");
    
    platforms.expo.forEach(key => {
      if (vars[key]) {
        const escapedValue = vars[key].replace(/"/g, '\\"');
        commands.push(`eas secret:create --scope project --name ${key} --value "${escapedValue}" --force`);
      } else {
        commands.push(`# Missing: ${key}`);
        commands.push(`# eas secret:create --scope project --name ${key} --value "YOUR_VALUE_HERE"`);
      }
    });
    
    commands.push("\ncd ../..\n");
    
    return commands.join("\n");
  }

  function createLocalEnvTemplate() {
    const commands = [];
    commands.push("# ===== LOCAL .env FILE TEMPLATE =====\n");
    commands.push("# Copy this to your .env.local file\n\n");
    
    const allVars = new Set();
    Object.values(platforms).forEach(platformVars => {
      platformVars.forEach(v => allVars.add(v));
    });
    
    Array.from(allVars).sort().forEach(key => {
      if (vars[key]) {
        const value = vars[key];
        // Mask sensitive values in template
        if (key.includes("KEY") || key.includes("SECRET") || key.includes("TOKEN") || key.includes("PASSWORD")) {
          commands.push(`${key}=YOUR_${key}_HERE`);
        } else {
          commands.push(`${key}=${value}`);
        }
      } else {
        commands.push(`${key}=YOUR_${key}_HERE`);
      }
    });
    
    return commands.join("\n");
  }

  const script = `#!/bin/bash
# =============================================================================
# MAGNUS ENV SYNC COMMANDS
# =============================================================================
# Generated: ${new Date().toISOString()}
#
# ⚠️  IMPORTANT: Review all commands before executing!
# ⚠️  Some commands may require authentication (gh auth login, vercel login, etc.)
# ⚠️  Replace placeholder values (YOUR_VALUE_HERE) with actual values
#
# =============================================================================

set -e  # Exit on error

echo "🚀 Magnus Environment Sync Orchestrator"
echo "========================================"
echo ""
echo "This script contains commands to sync environment variables to:"
echo "  - GitHub Actions Secrets"
echo "  - Vercel Project Environment"
echo "  - Azure Container App Secrets"
echo "  - Render Service Environment"
echo "  - Expo EAS Secrets"
echo ""
echo "⚠️  Review each section before running!"
echo ""

${createGithubCommands()}

echo ""
echo ""

${createVercelCommands()}

echo ""
echo ""

${createAzureCommands()}

echo ""
echo ""

${createRenderCommands()}

echo ""
echo ""

${createExpoCommands()}

echo ""
echo ""

${createLocalEnvTemplate()}

echo ""
echo ""
echo "# =============================================================================
# END OF SYNC COMMANDS
# =============================================================================
echo ""
echo "✅ All sync commands generated!"
echo "📝 Review ENV_SYNC_COMMANDS.sh and execute sections as needed"
`;

  const scriptPath = path.join(process.cwd(), "ENV_SYNC_COMMANDS.sh");
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, 0o755);

  // Also create a summary
  const summary = {
    varsFound: Object.keys(vars).length,
    varsMissing: {},
    platforms: {}
  };

  Object.entries(platforms).forEach(([platform, requiredVars]) => {
    const missing = requiredVars.filter(v => !vars[v]);
    summary.platforms[platform] = {
      total: requiredVars.length,
      found: requiredVars.length - missing.length,
      missing: missing.length,
      missingVars: missing
    };
  });

  return {
    message: "✅ Environment sync script generated: ENV_SYNC_COMMANDS.sh",
    scriptPath,
    summary: {
      varsFound: Object.keys(vars).length,
      platforms: summary.platforms
    }
  };
};

// Allow direct execution
if (require.main === module) {
  module.exports().then(result => {
    console.log(result.message);
    console.log("\n📊 Summary:");
    console.log(`  - Variables found: ${result.summary.varsFound}`);
    console.log("\n📋 Platform Coverage:");
    Object.entries(result.summary.platforms).forEach(([platform, stats]) => {
      console.log(`  - ${platform}: ${stats.found}/${stats.total} (${stats.missing} missing)`);
      if (stats.missingVars.length > 0) {
        console.log(`    Missing: ${stats.missingVars.join(", ")}`);
      }
    });
    console.log(`\n📄 Script: ${result.scriptPath}`);
  }).catch(err => {
    console.error("❌ Error generating sync commands:", err);
    process.exit(1);
  });
}
