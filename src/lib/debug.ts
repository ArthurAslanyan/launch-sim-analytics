import { isDev } from "./env";

export const debug = (label: string, data: unknown) => {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${label}`, data);
  }
};
