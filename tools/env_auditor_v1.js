const fs = require("fs");
const path = require("path");

module.exports = async () => {
  const REQUIRED = {
    root: [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_ANON_KEY",
      "DATABASE_URL",
      "REDIS_URL",
      "OPENAI_API_KEY",
      "GEMINI_API_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET"
    ],
    vercel: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_API_BASE_URL",
      "AI_GATEWAY_API_KEY"
    ],
    azure: [
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_DB_URL",
      "REDIS_URL",
      "OPENAI_API_KEY",
      "GEMINI_API_KEY"
    ],
    github: [
      "SUPABASE_DB_URL",
      "SUPABASE_STAGING_DB_URL",
      "AZURE_CLIENT_ID",
      "AZURE_CLIENT_SECRET",
      "AZURE_TENANT_ID",
      "AZURE_SUBSCRIPTION_ID",
      "VERCEL_TOKEN"
    ],
    expo: [
      "EXPO_PUBLIC_API_URL",
      "EXPO_PUBLIC_ENV",
      "EXPO_PUBLIC_VERSION"
    ]
  };

  function detectEnvFiles(dir) {
    const envs = {};
    
    function scanDirectory(currentDir, depth = 0) {
      // Limit depth to avoid scanning too deep
      if (depth > 5) return;
      
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          // Skip node_modules, .git, and other common ignore directories
          if (entry.isDirectory()) {
            if (entry.name.startsWith('.') && entry.name !== '.env') continue;
            if (entry.name === 'node_modules') continue;
            if (entry.name === '.git') continue;
            scanDirectory(fullPath, depth + 1);
          } else if (entry.isFile() && entry.name.startsWith(".env")) {
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              const lines = content.split("\n");
              envs[fullPath] = {};
              
              for (const line of lines) {
                const trimmed = line.trim();
                // Skip comments and empty lines
                if (!trimmed || trimmed.startsWith("#")) continue;
                
                if (trimmed.includes("=")) {
                  const [key] = trimmed.split("=");
                  const cleanKey = key.trim();
                  if (cleanKey) {
                    envs[fullPath][cleanKey] = trimmed.substring(key.length + 1).trim();
                  }
                }
              }
            } catch (err) {
              // Skip files that can't be read
            }
          }
        }
      } catch (err) {
        // Skip directories that can't be read
      }
    }
    
    scanDirectory(dir);
    return envs;
  }

  function checkEncoding(value) {
    const issues = [];
    
    // Check for unencoded @ in URLs (should be %40)
    if (value && value.includes("@") && !value.includes("%40")) {
      if (value.match(/postgresql:\/\/.*@/)) {
        issues.push("DATABASE_URL contains unencoded '@' - should use %40");
      }
    }
    
    // Check for unencoded $ in passwords (should be %24)
    if (value && value.includes("$") && !value.includes("%24")) {
      if (value.match(/postgresql:\/\/.*\$.*@/)) {
        issues.push("DATABASE_URL contains unencoded '$' - should use %24");
      }
    }
    
    return issues;
  }

  function checkPlacement(filePath, vars) {
    const issues = [];
    const fileName = path.basename(filePath);
    
    // Check for SERVICE_ROLE in client-facing files
    if (fileName.includes("web") || fileName.includes("mobile") || fileName.includes("expo")) {
      if (vars["SUPABASE_SERVICE_ROLE_KEY"] || vars["NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"]) {
        issues.push("⚠️ CRITICAL: SERVICE_ROLE_KEY found in client-facing env file!");
      }
    }
    
    // Check for NEXT_PUBLIC_ vars in server-only files
    if (fileName.includes("worker") || fileName.includes("api") || fileName.includes("azure")) {
      const publicVars = Object.keys(vars).filter(k => k.startsWith("NEXT_PUBLIC_"));
      if (publicVars.length > 0) {
        issues.push(`⚠️ NEXT_PUBLIC_ vars in server-only file: ${publicVars.join(", ")}`);
      }
    }
    
    return issues;
  }

  const repoRoot = process.cwd();
  const found = detectEnvFiles(repoRoot);
  
  // Collect all found variables
  const allFoundVars = {};
  Object.values(found).forEach(fileVars => {
    Object.assign(allFoundVars, fileVars);
  });

  // Check for missing variables
  const missing = {};
  for (const section in REQUIRED) {
    missing[section] = REQUIRED[section].filter(k => {
      return !allFoundVars[k];
    });
  }

  // Check for encoding issues
  const encodingIssues = [];
  Object.entries(found).forEach(([filePath, vars]) => {
    Object.entries(vars).forEach(([key, value]) => {
      const issues = checkEncoding(value);
      if (issues.length > 0) {
        encodingIssues.push({
          file: filePath,
          key,
          issues
        });
      }
    });
  });

  // Check for placement issues
  const placementIssues = [];
  Object.entries(found).forEach(([filePath, vars]) => {
    const issues = checkPlacement(filePath, vars);
    if (issues.length > 0) {
      placementIssues.push({
        file: filePath,
        issues
      });
    }
  });

  // Generate report
  const report = `# MAGNUS ENV AUDIT REPORT v1

Generated: ${new Date().toISOString()}

## 📊 Summary

- **Total env files scanned**: ${Object.keys(found).length}
- **Total variables found**: ${Object.keys(allFoundVars).length}
- **Missing variables**: ${Object.values(missing).flat().length}
- **Encoding issues**: ${encodingIssues.length}
- **Placement issues**: ${placementIssues.length}

---

## ❌ Missing Variables

${Object.entries(missing)
  .map(([k, v]) => `### ${k.toUpperCase()}\n${v.length ? v.map(vv => `- \`${vv}\``).join("\n") : "✅ All good"}`)
  .join("\n\n")}

---

## 🔐 Encoding Issues

${encodingIssues.length > 0 
  ? encodingIssues.map(({file, key, issues}) => 
      `### ${path.basename(file)} → \`${key}\`\n${issues.map(i => `- ${i}`).join("\n")}`
    ).join("\n\n")
  : "✅ No encoding issues found"}

---

## ⚠️ Placement Issues

${placementIssues.length > 0
  ? placementIssues.map(({file, issues}) =>
      `### ${path.basename(file)}\n${issues.map(i => `- ${i}`).join("\n")}`
    ).join("\n\n")
  : "✅ No placement issues found"}

---

## 📁 Scanned Files

${Object.keys(found).map(f => `- \`${f}\``).join("\n")}

---

## 📝 Notes

- **SERVICE_ROLE_KEY** must NOT appear in Vercel public env vars or Expo/mobile env files
- **DATABASE_URL** must use encoded password: \`%40\` for '@', \`%24\` for '$'
- **REDIS_URL** must use encoded password too
- **NEXT_PUBLIC_*** vars should only be in web/mobile apps, never in workers or API servers
- **SUPABASE_SERVICE_ROLE_KEY** should only be in backend/worker environments

---

## 🔧 Next Steps

Run the EnvSyncOrchestrator to generate sync commands for missing variables.

`;

  fs.writeFileSync(path.join(repoRoot, "ENV_AUDIT_REPORT.md"), report);

  // Generate fix commands
  const fixCommands = `#!/bin/bash
# Auto-generated fix commands for environment issues
# Review before running!

echo "🔍 Environment Fix Commands"
echo "=========================="
echo ""

${encodingIssues.length > 0 ? `# Fix encoding issues
echo "⚠️  Encoding issues found. Please manually fix these in your .env files:"
${encodingIssues.map(({file, key}) => `echo "  - ${file}: ${key}"`).join("\n")}
echo ""
` : ""}

${placementIssues.length > 0 ? `# Fix placement issues
echo "⚠️  Placement issues found. Please remove these variables from the wrong files:"
${placementIssues.map(({file}) => `echo "  - ${file}"`).join("\n")}
echo ""
` : ""}

# Missing variables reminder
echo "📋 Missing variables to add:"
${Object.entries(missing)
  .filter(([_, vars]) => vars.length > 0)
  .map(([section, vars]) => 
    `echo ""
echo "### ${section.toUpperCase()}:"
${vars.map(v => `echo "  - ${v}"`).join("\n")}`
  ).join("\n")}

echo ""
echo "✅ Review ENV_AUDIT_REPORT.md for full details"
`;

  fs.writeFileSync(path.join(repoRoot, "FIX_COMMANDS.sh"), fixCommands);
  fs.chmodSync(path.join(repoRoot, "FIX_COMMANDS.sh"), 0o755);

  return {
    message: "✅ ENV audit complete. See ENV_AUDIT_REPORT.md and FIX_COMMANDS.sh",
    reportPath: path.join(repoRoot, "ENV_AUDIT_REPORT.md"),
    commandsPath: path.join(repoRoot, "FIX_COMMANDS.sh"),
    summary: {
      filesScanned: Object.keys(found).length,
      varsFound: Object.keys(allFoundVars).length,
      missing: Object.values(missing).flat().length,
      encodingIssues: encodingIssues.length,
      placementIssues: placementIssues.length
    }
  };
};

// Allow direct execution
if (require.main === module) {
  module.exports().then(result => {
    console.log(result.message);
    console.log("\n📊 Summary:");
    console.log(`  - Files scanned: ${result.summary.filesScanned}`);
    console.log(`  - Variables found: ${result.summary.varsFound}`);
    console.log(`  - Missing variables: ${result.summary.missing}`);
    console.log(`  - Encoding issues: ${result.summary.encodingIssues}`);
    console.log(`  - Placement issues: ${result.summary.placementIssues}`);
    console.log(`\n📄 Report: ${result.reportPath}`);
    console.log(`🔧 Commands: ${result.commandsPath}`);
  }).catch(err => {
    console.error("❌ Error running audit:", err);
    process.exit(1);
  });
}
