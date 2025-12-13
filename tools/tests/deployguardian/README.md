# DeployGuardian Contract Tests

This directory contains **contract tests** for DeployGuardian v2. These tests ensure that:

1. **JSON output matches the formal schema**
2. **Exit codes are correct**
3. **Verdict logic is deterministic**
4. **Check results are accurate**

## Philosophy

Contract tests are **deterministic** and **infrastructure-free**:
- ✅ No real Docker builds
- ✅ No real Terraform operations
- ✅ No network calls
- ✅ No actual file system operations (beyond fixtures)
- ✅ Predictable, repeatable results

## Fixture Structure

Each fixture represents a **known repository state** and its **expected validation outcome**.

```
fixtures/
├── safe-predeploy/       # All checks pass, SAFE verdict
│   ├── repo.config.json  # Simulated repo state
│   └── expected.json     # Expected DeployGuardian output
├── unsafe-predeploy/     # Blockers present, UNSAFE verdict
│   ├── repo.config.json
│   └── expected.json
└── tool-error/           # DeployGuardian itself crashes
    ├── repo.config.json
    └── expected.json
```

## Running Tests

### Run all contract tests:
```bash
node tools/tests/deployguardian/run_contract_test.js all
```

### Run specific fixture:
```bash
node tools/tests/deployguardian/run_contract_test.js safe-predeploy
node tools/tests/deployguardian/run_contract_test.js unsafe-predeploy
node tools/tests/deployguardian/run_contract_test.js tool-error
```

### In CI:
```bash
# Contract tests run in a separate job before deployment
# See .github/workflows/deployguardian-contract-tests.yml
```

## Exit Codes

- **0** - All tests passed
- **1** - Contract violation (schema, verdict, or check mismatch)
- **2** - Test runner error

## What Gets Tested

### Schema Validation
- JSON output conforms to `deployguardian.contract.schema.json`
- All required fields present
- Field types correct
- Enum values valid

### Verdict Logic
- `verdict.status` matches expected (SAFE/UNSAFE)
- `verdict.exitCode` matches expected (0/1/2)
- `verdict.blockers` count is accurate
- `verdict.warnings` count is accurate

### Check Results
- All expected checks are present
- Check statuses match expected (PASS/WARN/FAIL/SKIP)
- Check severities match expected (INFO/WARNING/BLOCKER)
- Check IDs are stable (don't change between runs)

## Adding New Fixtures

1. Create a new directory under `fixtures/`
2. Add `repo.config.json` (simulated repo state)
3. Add `expected.json` (expected output)
4. Run the test: `node run_contract_test.js your-fixture-name`
5. Update CI workflow to include the new fixture

## Fixture Format

### repo.config.json

Defines the simulated repository state:

```json
{
  "mode": "pre-deploy",
  "terraform": {
    "exists": true,
    "valid": true,
    "hasDrift": false
  },
  "prisma": {
    "schemaExists": true,
    "schemaValid": true,
    "clientFresh": true
  },
  "workers": {
    "worker-realtime": {
      "dockerfileExists": true,
      "dockerfileValid": true,
      "hasFrom": true
    }
  },
  "secrets": {
    "DATABASE_URL": true,
    "SUPABASE_URL": true,
    "SUPABASE_ANON_KEY": true
  },
  "tests": {
    "passing": true
  },
  "lint": {
    "passing": true
  }
}
```

### expected.json

Defines what DeployGuardian **must** conclude:

```json
{
  "verdict": {
    "status": "SAFE",
    "exitCode": 0,
    "blockers": 0
  },
  "checks": [
    {
      "id": "terraform.validation",
      "status": "PASS",
      "severity": "WARNING"
    },
    {
      "id": "prisma.validation",
      "status": "PASS",
      "severity": "BLOCKER"
    }
  ]
}
```

## Contract Guarantees

These tests **guarantee**:

1. **No breaking changes** to JSON output format
2. **Stable check IDs** (dashboards can rely on them)
3. **Correct severity classification** (BLOCKER vs WARNING vs INFO)
4. **Correct exit codes** (CI gates work reliably)
5. **Deterministic behavior** (same input → same output)

## Failure Scenarios

### Schema Validation Fails
```
❌ CONTRACT VIOLATION: Schema validation failed
   Field 'verdict.status' is required but missing
```

→ **Fix:** Update DeployGuardian to include the missing field

### Verdict Mismatch
```
❌ CONTRACT VIOLATION: Verdict mismatch
   Expected: SAFE (exit 0)
   Actual:   UNSAFE (exit 1)
```

→ **Fix:** Check blocker count logic or update fixture expectations

### Check Mismatch
```
❌ CONTRACT VIOLATION: Check status mismatch
   Check: terraform.validation
   Expected: PASS
   Actual:   FAIL
```

→ **Fix:** Check validation logic or update fixture

## Integration with CI

Contract tests run in a **separate job** that:
- ✅ Runs **before** deployment
- ✅ Is **fast** (<10 seconds)
- ✅ Requires **no secrets**
- ✅ Requires **no infrastructure**
- ✅ **Blocks deployment** on failure

This ensures DeployGuardian itself doesn't break before it's used as a safety gate.
