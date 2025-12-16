/**
 * ESLint Plugin: SSR Guards
 * 
 * Reusable ESLint rules for Next.js App Router SSR safety.
 * Prevents common SSR violations that break builds.
 * 
 * Rules:
 * - no-hooks-in-error-boundaries: Blocks React hooks in error.tsx / global-error.tsx
 * 
 * Usage:
 * In .eslintrc.js:
 *   plugins: ["ssr-guards"],
 *   rules: {
 *     "ssr-guards/no-hooks-in-error-boundaries": "error"
 *   }
 */

module.exports = {
  rules: {
    "no-hooks-in-error-boundaries": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow React hooks in Next.js App Router error boundaries. " +
            "Error boundaries render before providers exist and will crash during SSR/prerender if hooks are used.",
          category: "Possible Errors",
          recommended: true,
          url: "https://nextjs.org/docs/app/building-your-application/routing/error-handling",
        },
        messages: {
          noHooksInErrorBoundary:
            "❌ HOOKS FORBIDDEN: '{{hookName}}' cannot be used in App Router error boundaries. " +
            "Error boundaries render before providers exist and will crash during SSR/prerender. " +
            "Use static JSX + inline styles only. See ERROR_BOUNDARY_RULES.md for details.",
        },
        schema: [],
        fixable: null,
      },

      create(context) {
        const filename = context.getFilename();

        // Detect if this is an error boundary file
        const isErrorBoundary =
          filename.includes("global-error") ||
          filename.includes("_global-error") ||
          filename.endsWith("/error.tsx") ||
          filename.endsWith("/error.jsx") ||
          filename.endsWith("\\error.tsx") || // Windows path
          filename.endsWith("\\error.jsx");

        // Skip if not an error boundary
        if (!isErrorBoundary) {
          return {};
        }

        return {
          // Detect hook calls: use*()
          CallExpression(node) {
            const callee = node.callee;

            // Check if it's a hook (starts with 'use' followed by uppercase)
            if (
              callee.type === "Identifier" &&
              /^use[A-Z]/.test(callee.name)
            ) {
              context.report({
                node,
                messageId: "noHooksInErrorBoundary",
                data: {
                  hookName: callee.name,
                },
              });
            }
          },

          // Detect hook imports: import { useState } from 'react'
          ImportDeclaration(node) {
            // Check if importing from 'react'
            if (node.source.value === "react") {
              node.specifiers.forEach((specifier) => {
                if (
                  specifier.type === "ImportSpecifier" &&
                  specifier.imported.type === "Identifier"
                ) {
                  const importedName = specifier.imported.name;

                  // Check if it's a hook import
                  if (/^use[A-Z]/.test(importedName)) {
                    context.report({
                      node: specifier,
                      messageId: "noHooksInErrorBoundary",
                      data: {
                        hookName: importedName,
                      },
                    });
                  }
                }
              });
            }
          },
        };
      },
    },
  },
};

