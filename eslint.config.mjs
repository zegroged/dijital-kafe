import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next@15 legacy (eslintrc) formatında; FlatCompat ile köprülüyoruz.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/**",
    ],
  },
  {
    rules: {
      // _ önekli parametreler (arayüz uyumu için) uyarı vermesin.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
