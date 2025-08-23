// Converted to **CommonJS** to avoid TS parsing issues in some toolchains that read the config as JS.
// This change resolves "Missing semicolon" errors when a TS parser isn't active for Tailwind config.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
