// Centralized environment access for Vite (browser) compatibility.
// Never use `process.env` in browser code — it is undefined and will crash.

export const env = import.meta.env;

export const isDev = import.meta.env.MODE === "development";
export const isProd = import.meta.env.MODE === "production";
