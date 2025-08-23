// Maps Telivy API error shapes to our client field names.
// We don't rely on a specific Telivy schema; we defensively inspect common shapes.
export type FieldErrors = Partial<{
  companyName: string;
  workEmail: string;
  companyDomain: string;
  fullName: string;
  phone: string;
}>;

const telivyToLocalKey: Record<string, keyof FieldErrors> = {
  company_name: 'companyName',
  work_email: 'workEmail',
  company_domain: 'companyDomain',
  full_name: 'fullName',
  phone: 'phone',
  // graceful fallbacks
  email: 'workEmail',
  domain: 'companyDomain',
  name: 'companyName',
};

export function mapTelivyErrors(payload: unknown): FieldErrors {
  const out: FieldErrors = {};
  if (!payload || typeof payload !== 'object') return out;
  const obj: any = payload;

  // Common patterns: { errors: { field: ["msg"] } } or { error: { field: "msg" } }
  const containers = [obj.errors, obj.error, obj.detail, obj.message];
  for (const c of containers) {
    if (!c) continue;
    if (typeof c === 'string') continue;
    if (Array.isArray(c)) continue;
    for (const k of Object.keys(c)) {
      const localKey = telivyToLocalKey[k] as keyof FieldErrors | undefined;
      if (!localKey) continue;
      const val = c[k];
      if (typeof val === 'string') out[localKey] = val;
      else if (Array.isArray(val) && val.length) out[localKey] = String(val[0]);
      else if (val && typeof val === 'object' && val.message) out[localKey] = String(val.message);
    }
  }

  return out;
}
