# ✅ AJV Draft 2020-12 - Final Correct Implementation

**Status:** Production-Ready  
**Version:** ajv@8.17.1  
**Pattern:** Strict Mode with Draft 2020-12  

---

## 📦 Dependencies (Minimal & Correct)

```json
{
  "devDependencies": {
    "ajv": "^8.17.1",          // Latest stable with Draft 2020-12 support
    "ajv-formats": "^2.1.1"    // Format validators (date, email, etc.)
  }
}
```

**No other packages needed!**  
❌ No `ajv-draft-2020` (doesn't exist)  
❌ No additional meta-schema packages  

---

## ✅ Correct Import Pattern

```javascript
const Ajv = require("ajv/dist/2020");  // Draft 2020-12 support built-in
const addFormats = require("ajv-formats");
```

**Why `ajv/dist/2020`?**
- Built into `ajv` v8.12.0+
- Automatically loads Draft 2020-12 meta-schema
- No external dependencies required

---

## ✅ Correct Initialization

```javascript
// Clean, minimal, production-grade
const ajv = new Ajv({ strict: true });
addFormats(ajv);

// Compile your schema
const validateSchema = ajv.compile(schema);
```

**That's it!** No verbose options needed.

---

## ❌ What We Removed (Incorrect/Unnecessary)

### Before (Verbose, Incorrect):
```javascript
const ajv = new Ajv({ 
  allErrors: true,           // ❌ Not needed for basic validation
  strict: false,             // ❌ WRONG - should be true for production
  validateFormats: true      // ❌ Redundant when using addFormats()
});
```

### After (Clean, Correct):
```javascript
const ajv = new Ajv({ strict: true });  // ✅ Simple and correct
addFormats(ajv);                        // ✅ One line for formats
```

---

## 🧪 Validation Results

All validations pass with correct pattern:

```bash
$ node tools/tests/deployguardian/run_contract_test.js all

✅ All fixture structures are valid
✅ Schema validation passed
✅ Contract version validation passed
✅ Schema hash validation passed
```

---

## 📊 What This Gives You

### Strict Mode Benefits:
- ✅ Catches unknown properties
- ✅ Enforces schema compliance
- ✅ Production-grade validation
- ✅ No silent failures

### Draft 2020-12 Features:
- ✅ `unevaluatedProperties` support
- ✅ Modern schema composition
- ✅ Better error messages
- ✅ Industry standard

### Format Validation:
- ✅ Email validation
- ✅ Date/time validation
- ✅ URL validation
- ✅ UUID validation

---

## 🎯 Complete Working Example

**File:** `tools/tests/deployguardian/run_contract_test.js`

```javascript
#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const Ajv = require("ajv/dist/2020");  // ✅ Draft 2020-12 support
const addFormats = require("ajv-formats");

// Load your schema
const schemaPath = path.join(__dirname, "../../deployguardian.contract.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// Initialize AJV with strict mode
const ajv = new Ajv({ strict: true });
addFormats(ajv);

// Compile and validate
const validateSchema = ajv.compile(schema);

// Use it
const output = JSON.parse(fs.readFileSync("output.json", "utf8"));
const isValid = validateSchema(output);

if (!isValid) {
  console.error("Validation errors:", validateSchema.errors);
  process.exit(1);
}

console.log("✅ Schema validation passed");
```

---

## 🔍 Key Differences Explained

### Why `strict: true` (not false)?

**`strict: false`:**
- Allows unknown keywords in schema
- Silently ignores mistakes
- Good for development/experimentation
- ❌ NOT production-grade

**`strict: true`:**
- Enforces schema correctness
- Catches typos and errors
- Fails on unknown keywords
- ✅ Production-grade

### Why remove `allErrors: true`?

**Not needed for basic validation:**
- Default behavior reports first error
- Sufficient for contract testing
- Faster validation
- Cleaner error output

**Use `allErrors: true` when:**
- Building form validation UI
- Need to show all errors to user
- Debugging complex schemas

### Why remove `validateFormats: true`?

**Redundant with `addFormats(ajv)`:**
- `addFormats()` enables format validation
- No need to set `validateFormats: true`
- One source of truth

---

## 📚 References

### Official AJV Documentation:
- Draft 2020-12: https://ajv.js.org/json-schema.html#draft-2020-12
- Strict Mode: https://ajv.js.org/strict-mode.html
- Formats: https://ajv.js.org/packages/ajv-formats.html

### JSON Schema Specification:
- Draft 2020-12: https://json-schema.org/draft/2020-12/

---

## ✅ Verification Checklist

- [x] Using `ajv@^8.17.1` (latest stable)
- [x] Using `ajv-formats@^2.1.1`
- [x] No invalid dependencies (ajv-draft-2020)
- [x] Import from `ajv/dist/2020`
- [x] Initialize with `{ strict: true }`
- [x] Call `addFormats(ajv)` after init
- [x] Contract tests pass
- [x] Schema validation works
- [x] Draft 2020-12 features available

---

## 🎓 Why This Pattern Matters

### Operator Mindset:
This is not "quick validation". This is **contract enforcement**:
- Schemas are law
- Validation is the referee
- Strict mode prevents silent failures
- Production systems don't guess

### Engineering Excellence:
```
❌ Quick & Dirty:  new Ajv({ strict: false }) // "Just make it work"
✅ Production-Grade: new Ajv({ strict: true })  // "Make it right"
```

### Maintenance:
- Clean code = fewer bugs
- Explicit = auditable
- Minimal = maintainable
- Standard = replaceable

---

## 🚀 Final Status

| Component | Status |
|-----------|--------|
| AJV version | ✅ 8.17.1 (latest) |
| Import pattern | ✅ ajv/dist/2020 |
| Initialization | ✅ { strict: true } |
| Format support | ✅ addFormats(ajv) |
| Draft 2020-12 | ✅ Working |
| Contract tests | ✅ Passing |
| Production-ready | ✅ Yes |

---

**Commit History:**
- `09b0f6c` - refactor: use correct AJV Draft 2020-12 pattern with strict mode
- `ece692f` - fix: remove non-existent ajv-draft-2020 package dependency

**This is the canonical reference for AJV usage in this project.**
