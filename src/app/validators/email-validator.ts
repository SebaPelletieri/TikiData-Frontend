import { AbstractControl, ValidationErrors } from '@angular/forms';

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Proveedores conocidos y las terminaciones reales que tienen
const KNOWN_PROVIDERS: Record<string, string[]> = {
  gmail: ['com'],
  hotmail: ['com', 'com.ar', 'es'],
  outlook: ['com', 'com.ar', 'es'],
  yahoo: ['com', 'com.ar', 'es'],
  icloud: ['com'],
};

const VALID_TLDS = [
  'com', 'net', 'org', 'edu', 'gov', 'info', 'io', 'dev',
  'ar', 'com.ar', 'edu.ar', 'gob.ar', 'org.ar', 'net.ar',
  'es', 'br', 'com.br', 'uy', 'cl', 'co', 'mx', 'pe', 'py', 'bo', 've', 'ec',
  'us', 'uk', 'co.uk', 'de', 'fr', 'it', 'pt',
];

export function emailValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim().toLowerCase();
  if (!value) return null; 

  const invalid = { pattern: true, email: true };

  if (!EMAIL_PATTERN.test(value)) return invalid;

  const domain = value.split('@')[1];
  const labels = domain.split('.');
  const provider = labels[0];
  const suffix = labels.slice(1).join('.');

  if (KNOWN_PROVIDERS[provider]) {
    return KNOWN_PROVIDERS[provider].includes(suffix) ? null : invalid;
  }

  return VALID_TLDS.some((tld) => domain.endsWith('.' + tld)) ? null : invalid;
}