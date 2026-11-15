import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Pasa a minúsculas, saca tildes y espacios repetidos para comparar textos. */
export function normalize(text: unknown): string {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function isSameRecord(item: any, excludeId: unknown): boolean {
  if (excludeId === null || excludeId === undefined || excludeId === '') return false;
  return String(item?.id) === String(excludeId);
}

/**
 * Valida que un campo sea único dentro de una lista (ej: nombre de equipo).
 * Se aplica a un FormControl.
 *
 * @param getItems      devuelve la lista actual de registros existentes
 * @param field         campo a comparar (ej: 'name')
 * @param getExcludeId  (opcional) id del registro que se está editando, para no compararlo consigo mismo
 */
export function uniqueFieldValidator(
  getItems: () => any[],
  field: string,
  getExcludeId?: () => unknown,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = normalize(control.value);
    if (!value) return null;

    const excludeId = getExcludeId ? getExcludeId() : null;
    const exists = (getItems() || []).some(
      (item) => !isSameRecord(item, excludeId) && normalize(item?.[field]) === value,
    );
    return exists ? { duplicate: true } : null;
  };
}


export function uniqueCombinationValidator(
  fields: string[],
  getItems: () => any[],
  getExcludeId?: () => unknown,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const values = fields.map((f) => normalize(group.get(f)?.value));
    if (values.some((v) => !v)) return null;

    const excludeId = getExcludeId ? getExcludeId() : null;
    const exists = (getItems() || []).some(
      (item) =>
        !isSameRecord(item, excludeId) &&
        fields.every((f, i) => normalize(item?.[f]) === values[i]),
    );
    return exists ? { duplicate: true } : null;
  };
}


export function uniqueValueValidator(getExisting: () => string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = normalize(control.value);
    if (!value) return null;
    return getExisting().some((existing) => normalize(existing) === value)
      ? { duplicate: true }
      : null;
  };
}