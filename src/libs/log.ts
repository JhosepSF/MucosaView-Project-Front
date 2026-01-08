// src/lib/log.ts
export const DEBUG_SYNC = true; 

export function D(...args: any[]) {
  if (DEBUG_SYNC) console.log(...args);
}
