module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
      tsconfigRootDir: __dirname,
      project: ["./tsconfig.json"],
  },
  plugins: [
      "@typescript-eslint",
      "prettier"
  ],
  extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:node/recommended",
      "plugin:@typescript-eslint/strict",
      "plugin:prettier/recommended"
  ],
  ignorePatterns: [".eslintrc.cjs", "test/*"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "error",
    "prettier/prettier": "error",
    "require-await": "warn",
    "node/no-missing-import": "off",
    "no-process-exit": "off"
  },
};
