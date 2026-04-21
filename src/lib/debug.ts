import { isDev } from "./env";

export const debug = (label: string, data: unknown) => {
  if (isDev) {
    console.log(`[DEBUG] ${label}`, data);
  }
};
