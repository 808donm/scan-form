// scripts/schema-test.mjs
// Minimal test runner for ScanRequestSchema and mapTelivyErrors without Vitest/Vite/Rollup.
// Windows-safe: uses file:// URLs for dynamic imports.
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import validation & error map via proper file URLs (Windows ESM requirement)
const validationUrl = pathToFileURL(resolve(__dirname, '../lib/validation.ts')).href;
const validationMod = await import(validationUrl);
const ScanRequestSchema =
  validationMod.ScanRequestSchema ?? validationMod.default ?? validationMod.schema;
if (!ScanRequestSchema) throw new Error('ScanRequestSchema export not found in lib/validation.ts');

const errorUrl = pathToFileURL(resolve(__dirname, '../lib/errorMap.ts')).href;
const errorMapMod = await import(errorUrl);
const mapTelivyErrors = errorMapMod.mapTelivyErrors ?? errorMapMod.default;
if (!mapTelivyErrors) throw new Error('mapTelivyErrors export not found in lib/errorMap.ts');

// --- tests ---
function testValidPayload() {
  const res = ScanRequestSchema.safeParse({
    companyName: 'Enterprise Technology Solutions',
    workEmail: 'ops@example.com',
    companyDomain: 'example.com',
    fullName: 'Don Mangiarelli',
    phone: '808-377-6300',
    turnstileToken: 'token_1234567890',
  });
  assert.equal(res.success, true);
}
function testInvalidEmail() {
  const res = ScanRequestSchema.safeParse({
    companyName: 'ETS',
    workEmail: 'bad',
    companyDomain: 'example.com',
    fullName: 'Don',
    phone: '808-377-6300',
    turnstileToken: 'token_1234567890',
  });
  assert.equal(res.success, false);
}
function testMissingToken() {
  const res = ScanRequestSchema.safeParse({
    companyName: 'ETS',
    workEmail: 'ops@example.com',
    companyDomain: 'example.com',
    fullName: 'Don',
    phone: '808-377-6300',
  });
  assert.equal(res.success, false);
}
function testShortName() {
  const res = ScanRequestSchema.safeParse({
    companyName: 'A',
    workEmail: 'ops@example.com',
    companyDomain: 'example.com',
    fullName: 'Don',
    phone: '808-377-6300',
    turnstileToken: 'token_1234567890',
  });
  assert.equal(res.success, false);
}
function testShortDomain() {
  const res = ScanRequestSchema.safeParse({
    companyName: 'ETS',
    workEmail: 'ops@example.com',
    companyDomain: 'ab',
    fullName: 'Don',
    phone: '808-377-6300',
    turnstileToken: 'token_1234567890',
  });
  assert.equal(res.success, false);
}
function testEmptyPhone() {
  const res = ScanRequestSchema.safeParse({
    companyName: 'ETS',
    workEmail: 'ops@example.com',
    companyDomain: 'example.com',
    fullName: 'Don',
    phone: '',
    turnstileToken: 'token_1234567890',
  });
  assert.equal(res.success, false);
}
function testErrorMapArray() {
  const res = mapTelivyErrors({ errors: { work_email: ['Invalid'] } });
  assert.deepEqual(res, { workEmail: 'Invalid' });
}
function testErrorMapObject() {
  const res = mapTelivyErrors({ error: { company_name: 'Required' } });
  assert.deepEqual(res, { companyName: 'Required' });
}
function testErrorMapWeird() {
  const res = mapTelivyErrors('weird');
  assert.deepEqual(res, {});
}
function testErrorMapMultiple() {
  const res = mapTelivyErrors({
    errors: { work_email: ['Bad', 'Worse'], company_domain: ['Not resolvable'] },
  });
  assert.deepEqual(res, { workEmail: 'Bad', companyDomain: 'Not resolvable' });
}

function run() {
  testValidPayload();
  testInvalidEmail();
  testMissingToken();
  testShortName();
  testShortDomain();
  testEmptyPhone();
  testErrorMapArray();
  testErrorMapObject();
  testErrorMapWeird();
  testErrorMapMultiple();
  console.log('All schema/errorMap tests passed.');
}

run();
