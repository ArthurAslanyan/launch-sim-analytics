// debug.ts

export const debug = (label: string, data: unknown) => {
  if (import.meta.env.MODE !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${label}`, data);
  }
};
