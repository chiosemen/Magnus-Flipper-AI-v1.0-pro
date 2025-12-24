/**
 * 🔒 CONTRACT BOUNDARY ENFORCEMENT
 * 
 * This ESLint config enforces the contract boundary at lint time.
 * Violations are caught before build, making the feedback loop instant.
 * 
 * To use: merge this into your main .eslintrc.json or import it.
 */

module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@magnus-flipper-ai/core",
            message: "🚫 Import from @/lib/types instead (contract boundary). See apps/web/__forbidden__/index.d.ts"
          },
          {
            name: "@magnus-flipper-ai/feed-engine",
            message: "🚫 Import from @/lib/types instead (contract boundary). See apps/web/__forbidden__/index.d.ts"
          }
        ],
        patterns: [
          {
            group: ["@magnus-flipper-ai/core/*"],
            message: "🚫 Import from @/lib/types/* instead (contract boundary). See apps/web/__forbidden__/index.d.ts"
          },
          {
            group: ["@magnus-flipper-ai/feed-engine/*"],
            message: "🚫 Import from @/lib/types/* instead (contract boundary). See apps/web/__forbidden__/index.d.ts"
          }
        ]
      }
    ]
  }
};

