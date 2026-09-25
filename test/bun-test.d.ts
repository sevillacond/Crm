declare module 'bun:test' {
  export const test: (name: string, fn: () => void | Promise<void>, options?: { timeout?: number }) => void;
  export const expect: (val: any) => { toBe: (expected: any) => void };
}
