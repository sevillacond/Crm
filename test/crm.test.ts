import { test, expect } from 'bun:test';
import { spawnSync } from 'child_process';

test('Enlace-CRM Automated Test Suite (50+ checks)', () => {
  const result = spawnSync('bun', ['test/run-tests.ts'], {
    stdio: 'inherit',
    env: process.env
  });
  expect(result.status).toBe(0);
}, { timeout: 60000 });
