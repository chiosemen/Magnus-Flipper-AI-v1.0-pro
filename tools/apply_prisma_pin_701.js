#!/usr/bin/env node

/**
 * Apply Prisma Pin 7.0.1
 * Pins Prisma + client + adapter-pg to 7.0.1 across the mono-repo
 */

const { applyPrisma701Pin } = require("./prisma_alpine_surgeon");

async function main() {
  console.log("==============================================");
  console.log("  Apply Prisma Pin 7.0.1");
  console.log("==============================================\n");

  const result = applyPrisma701Pin();
  console.log(result);

  console.log("\n✅ Done. Run 'pnpm install --no-frozen-lockfile' to update lockfile.\n");
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
