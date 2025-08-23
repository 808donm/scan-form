import { describe, it, expect } from 'vitest';
import { ScanRequestSchema } from '../lib/validation';
import { mapTelivyErrors } from '../lib/errorMap';

describe('ScanRequestSchema', () => {
  it('accepts a valid payload', () => {
    const result = ScanRequestSchema.safeParse({
      companyName: 'Enterprise Technology Solutions',
      workEmail: 'ops@example.com',
      companyDomain: 'example.com',
      fullName: 'Don Mangiarelli',
      phone: '808-377-6300',
      turnstileToken: 'token_1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when email is invalid', () => {
    const result = ScanRequestSchema.safeParse({
      companyName: 'ETS',
      workEmail: 'not-an-email',
      companyDomain: 'example.com',
      fullName: 'Don',
      phone: '808-377-6300',
      turnstileToken: 'token_1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when Turnstile token missing', () => {
    // @ts-expect-error intentional missing token
    const result = ScanRequestSchema.safeParse({
      companyName: 'ETS',
      workEmail: 'ops@example.com',
      companyDomain: 'example.com',
      fullName: 'Don',
      phone: '808-377-6300',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when company name is too short', () => {
    const result = ScanRequestSchema.safeParse({
      companyName: 'A',
      workEmail: 'ops@example.com',
      companyDomain: 'example.com',
      fullName: 'Don',
      phone: '808-377-6300',
      turnstileToken: 'token_1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when domain is shorter than 3 chars', () => {
    const result = ScanRequestSchema.safeParse({
      companyName: 'ETS',
      workEmail: 'ops@example.com',
      companyDomain: 'ab',
      fullName: 'Don',
      phone: '808-377-6300',
      turnstileToken: 'token_1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when phone is missing', () => {
    const result = ScanRequestSchema.safeParse({
      companyName: 'ETS',
      workEmail: 'ops@example.com',
      companyDomain: 'example.com',
      fullName: 'Don',
      phone: '',
      turnstileToken: 'token_1234567890',
    });
    expect(result.success).toBe(false);
  });
});

describe('mapTelivyErrors', () => {
  it('maps { errors: { work_email: ["Invalid"] } }', () => {
    const res = mapTelivyErrors({ errors: { work_email: ['Invalid'] } });
    expect(res).toEqual({ workEmail: 'Invalid' });
  });
  it('maps { error: { company_name: "Required" } }', () => {
    const res = mapTelivyErrors({ error: { company_name: 'Required' } });
    expect(res).toEqual({ companyName: 'Required' });
  });
  it('ignores unexpected shapes gracefully', () => {
    const res = mapTelivyErrors('weird');
    expect(res).toEqual({});
  });
});
