import config from "@ssv/eslint-config";
import tailwindCanonicalClasses from "eslint-plugin-tailwind-canonical-classes";

export default [
  ...config,
  {
    plugins: {
      "tailwind-canonical-classes": tailwindCanonicalClasses,
    },
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "error",
        { cssPath: "./src/app/globals.css" },
      ],
    },
  },
];
