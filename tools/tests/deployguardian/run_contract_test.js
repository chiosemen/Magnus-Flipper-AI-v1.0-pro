#!/usr/bin/env node
/**
 * DeployGuardian Contract Test Runner
 * 
 * Validates DeployGuardian JSON output against:
 * 1. JSON Schema (structural correctness)
 * 2. Expected verdict (SAFE/UNSAFE)
 * 3. Expected exit code
 * 4. Expected check results
 * 
 * Exit codes:
 * 0 - All tests passed
 * 1 - Contract violation
 * 2 - Test runner error
 * 
 * NOTE:
 * DeployGuardian uses JSON Schema Draft 2020-12.
 * ajv-draft-2020 MUST be registered or schema validation will fail.
 */

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv/dist/2020");  // Use Ajv2020 for Draft 2020-12
const addFormats = require("ajv-formats");

// Colors for output
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(msg, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

function error(msg) {
  log(`❌ ${msg}`, COLORS.red);
}

function success(msg) {
  log(`✅ ${msg}`, COLORS.green);
}

function info(msg) {
  log(`ℹ️  ${msg}`, COLORS.cyan);
}

// Load schema
const schemaPath = path.join(__dirname, "../../deployguardian.contract.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// Initialize AJV with Draft 2020-12 support
// NOTE: Using Ajv2020 from ajv/dist/2020 automatically loads Draft 2020-12 meta-schema
const ajv = new Ajv({ 
  allErrors: true, 
  strict: false,  // Important for evolving contracts
  validateFormats: true
});
addFormats(ajv);

const validateSchema = ajv.compile(schema);

/**
 * Compute schema hash
 */
function getSchemaHash() {
  const crypto = require("crypto");
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  return crypto.createHash("sha256").update(schemaContent).digest("hex");
}

/**
 * Validate contract version negotiation
 */
function validateContractVersion(output) {
  // Check if contract field exists
  if (!output.contract) {
    // Legacy payload without contract field - warn but allow
    log(`⚠️  Legacy payload detected (no contract field) - inferring as v1.x`, COLORS.yellow);
    return true;
  }
  
  const { version, schemaSha256 } = output.contract;
  
  // Parse version
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    error(`CONTRACT VIOLATION: Invalid contract version format: ${version}`);
    return false;
  }
  
  const [, major, minor] = match;
  const expectedMajor = "2";
  
  // Check major version
  if (major !== expectedMajor) {
    error(`CONTRACT VIOLATION: Major version mismatch`);
    error(`  Expected: ${expectedMajor}.x.x`);
    error(`  Actual: ${version}`);
    return false;
  }
  
  // Warn on minor version mismatch (but allow)
  const expectedMinor = "1";
  if (minor !== expectedMinor) {
    log(`⚠️  Minor version mismatch (expected ${expectedMajor}.${expectedMinor}.x, got ${version}) - allowing`, COLORS.yellow);
  }
  
  // Validate schema hash if present
  if (schemaSha256) {
    const actualHash = getSchemaHash();
    if (schemaSha256 !== actualHash) {
      error(`CONTRACT VIOLATION: Schema hash mismatch`);
      error(`  Expected: ${actualHash}`);
      error(`  Actual: ${schemaSha256}`);
      error(`  This indicates schema drift without version bump`);
      return false;
    }
    success("Schema hash validation passed");
  }
  
  success("Contract version validation passed");
  return true;
}

/**
 * Validate JSON output against schema
 */
function validateAgainstSchema(output) {
  const valid = validateSchema(output);
  
  if (!valid) {
    error("CONTRACT VIOLATION: Schema validation failed");
    console.log();
    for (const err of validateSchema.errors) {
      error(`  ${err.instancePath || "root"}: ${err.message}`);
      if (err.params) {
        console.log(`    ${JSON.stringify(err.params, null, 2)}`);
      }
    }
    return false;
  }
  
  success("Schema validation passed");
  return true;
}

/**
 * Validate verdict matches expectations
 */
function validateVerdict(output, expected) {
  let passed = true;
  
  // Check status
  if (expected.verdict.status && output.verdict.status !== expected.verdict.status) {
    error(`CONTRACT VIOLATION: Verdict status mismatch`);
    error(`  Expected: ${expected.verdict.status}`);
    error(`  Actual: ${output.verdict.status}`);
    passed = false;
  }
  
  // Check exit code
  if (expected.verdict.exitCode !== undefined && output.verdict.exitCode !== expected.verdict.exitCode) {
    error(`CONTRACT VIOLATION: Exit code mismatch`);
    error(`  Expected: ${expected.verdict.exitCode}`);
    error(`  Actual: ${output.verdict.exitCode}`);
    passed = false;
  }
  
  // Check blockers (exact match or minimum)
  if (expected.verdict.blockers !== undefined) {
    if (output.verdict.blockers !== expected.verdict.blockers) {
      error(`CONTRACT VIOLATION: Blocker count mismatch`);
      error(`  Expected: ${expected.verdict.blockers}`);
      error(`  Actual: ${output.verdict.blockers}`);
      passed = false;
    }
  } else if (expected.verdict.minBlockers !== undefined) {
    if (output.verdict.blockers < expected.verdict.minBlockers) {
      error(`CONTRACT VIOLATION: Blocker count below minimum`);
      error(`  Expected minimum: ${expected.verdict.minBlockers}`);
      error(`  Actual: ${output.verdict.blockers}`);
      passed = false;
    }
  }
  
  // Check warnings (minimum)
  if (expected.verdict.minWarnings !== undefined) {
    if (output.verdict.warnings < expected.verdict.minWarnings) {
      error(`CONTRACT VIOLATION: Warning count below minimum`);
      error(`  Expected minimum: ${expected.verdict.minWarnings}`);
      error(`  Actual: ${output.verdict.warnings}`);
      passed = false;
    }
  }
  
  // Check passed (minimum)
  if (expected.verdict.minPassed !== undefined) {
    if (output.verdict.passed < expected.verdict.minPassed) {
      error(`CONTRACT VIOLATION: Passed count below minimum`);
      error(`  Expected minimum: ${expected.verdict.minPassed}`);
      error(`  Actual: ${output.verdict.passed}`);
      passed = false;
    }
  }
  
  if (passed) {
    success("Verdict validation passed");
  }
  
  return passed;
}

/**
 * Validate checks match expectations
 */
function validateChecks(output, expected) {
  if (!expected.checks || expected.checks.length === 0) {
    info("No check expectations defined, skipping check validation");
    return true;
  }
  
  let passed = true;
  
  for (const expectedCheck of expected.checks) {
    const actualCheck = output.checks.find(c => c.id === expectedCheck.id);
    
    if (!actualCheck) {
      error(`CONTRACT VIOLATION: Expected check not found: ${expectedCheck.id}`);
      passed = false;
      continue;
    }
    
    // Check status
    if (expectedCheck.status && actualCheck.status !== expectedCheck.status) {
      error(`CONTRACT VIOLATION: Check status mismatch for ${expectedCheck.id}`);
      error(`  Expected: ${expectedCheck.status}`);
      error(`  Actual: ${actualCheck.status}`);
      passed = false;
    }
    
    // Check severity
    if (expectedCheck.severity && actualCheck.severity !== expectedCheck.severity) {
      error(`CONTRACT VIOLATION: Check severity mismatch for ${expectedCheck.id}`);
      error(`  Expected: ${expectedCheck.severity}`);
      error(`  Actual: ${actualCheck.severity}`);
      passed = false;
    }
  }
  
  if (passed) {
    success("Check validation passed");
  }
  
  return passed;
}

/**
 * Run contract test for a fixture
 */
function runFixtureTest(fixtureName) {
  log(`\n${"=".repeat(60)}`, COLORS.cyan);
  log(`Testing fixture: ${fixtureName}`, COLORS.cyan);
  log("=".repeat(60), COLORS.cyan);
  
  const fixtureDir = path.join(__dirname, "fixtures", fixtureName);
  
  // Check if fixture exists
  if (!fs.existsSync(fixtureDir)) {
    error(`Fixture not found: ${fixtureName}`);
    return false;
  }
  
  // Load expected results
  const expectedPath = path.join(fixtureDir, "expected.json");
  if (!fs.existsSync(expectedPath)) {
    error(`Expected results not found: ${expectedPath}`);
    return false;
  }
  
  const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
  
  // For fixtures that test tool errors, we just validate they exist
  if (expected.verdict.expectError) {
    info("Tool error fixture - manual validation required");
    success("Fixture structure valid");
    return true;
  }
  
  // Look for actual output (this would be generated by a real run)
  // For now, we'll just validate the fixture structure is correct
  info("Note: This is a fixture structure validation");
  info("To run full contract tests, generate actual output with:");
  info(`  node tools/deploy_guardian.js --mode=pre-deploy --format=json --out=output.json`);
  info(`  node tools/tests/deployguardian/run_contract_test.js --validate output.json ${fixtureName}`);
  
  success("Fixture structure is valid");
  return true;
}

/**
 * Validate actual output against fixture expectations
 */
function validateOutput(outputPath, fixtureName) {
  log(`\n${"=".repeat(60)}`, COLORS.cyan);
  log(`Validating output against fixture: ${fixtureName}`, COLORS.cyan);
  log("=".repeat(60), COLORS.cyan);
  
  // Load actual output
  if (!fs.existsSync(outputPath)) {
    error(`Output file not found: ${outputPath}`);
    return false;
  }
  
  const output = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  
  // Load expected results
  const fixtureDir = path.join(__dirname, "fixtures", fixtureName);
  const expectedPath = path.join(fixtureDir, "expected.json");
  
  if (!fs.existsSync(expectedPath)) {
    error(`Expected results not found: ${expectedPath}`);
    return false;
  }
  
  const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
  
  // Run validations
  console.log();
  const contractValid = validateContractVersion(output);
  console.log();
  const schemaValid = validateAgainstSchema(output);
  console.log();
  const verdictValid = validateVerdict(output, expected);
  console.log();
  const checksValid = validateChecks(output, expected);
  console.log();
  
  const allValid = contractValid && schemaValid && verdictValid && checksValid;
  
  if (allValid) {
    log("=".repeat(60), COLORS.green);
    success("ALL CONTRACT TESTS PASSED");
    log("=".repeat(60), COLORS.green);
  } else {
    log("=".repeat(60), COLORS.red);
    error("CONTRACT TESTS FAILED");
    log("=".repeat(60), COLORS.red);
  }
  
  return allValid;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Usage:");
    console.log("  Validate fixture structure:");
    console.log("    node run_contract_test.js <fixture-name>");
    console.log("    node run_contract_test.js all");
    console.log();
    console.log("  Validate actual output:");
    console.log("    node run_contract_test.js --validate <output.json> <fixture-name>");
    console.log();
    console.log("Available fixtures:");
    const fixturesDir = path.join(__dirname, "fixtures");
    const fixtures = fs.readdirSync(fixturesDir).filter(f => 
      fs.statSync(path.join(fixturesDir, f)).isDirectory()
    );
    fixtures.forEach(f => console.log(`  - ${f}`));
    process.exit(2);
  }
  
  // Validate output mode
  if (args[0] === "--validate") {
    if (args.length < 3) {
      error("Missing arguments for --validate mode");
      console.log("Usage: node run_contract_test.js --validate <output.json> <fixture-name>");
      process.exit(2);
    }
    
    const outputPath = args[1];
    const fixtureName = args[2];
    const passed = validateOutput(outputPath, fixtureName);
    process.exit(passed ? 0 : 1);
  }
  
  // Fixture structure validation mode
  const fixtureName = args[0];
  
  if (fixtureName === "all") {
    const fixturesDir = path.join(__dirname, "fixtures");
    const fixtures = fs.readdirSync(fixturesDir).filter(f => 
      fs.statSync(path.join(fixturesDir, f)).isDirectory()
    );
    
    let allPassed = true;
    for (const fixture of fixtures) {
      const passed = runFixtureTest(fixture);
      if (!passed) allPassed = false;
    }
    
    console.log();
    if (allPassed) {
      success("All fixture structures are valid");
      process.exit(0);
    } else {
      error("Some fixture structures are invalid");
      process.exit(1);
    }
  } else {
    const passed = runFixtureTest(fixtureName);
    process.exit(passed ? 0 : 1);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    error(`Test runner error: ${err.message}`);
    console.error(err.stack);
    process.exit(2);
  }
}

module.exports = { validateAgainstSchema, validateVerdict, validateChecks, validateOutput };
