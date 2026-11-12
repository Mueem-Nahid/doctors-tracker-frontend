import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/atoms/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          "@/components/molecules/**",
          "@/components/organisms/**",
          "@/components/templates/**",
          "@/lib/queries/**",
          "@/stores/**",
          "nuqs",
        ],
      }],
    },
  },
  {
    files: ["src/components/molecules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          "@/components/organisms/**",
          "@/components/templates/**",
          "@/lib/queries/**",
          "@/stores/**",
          "nuqs",
        ],
      }],
    },
  },
  {
    files: ["src/components/organisms/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: ["@/components/templates/**"],
      }],
    },
  },
  {
    files: ["src/components/templates/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: ["@/lib/queries/**", "@/stores/**", "nuqs"],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
