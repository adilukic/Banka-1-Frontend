import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validira da polje sadrži tačno određeni broj cifara.
 * @param length - Traženi broj cifara
 * @returns Validator funkcija
 */
export function exactDigitsValidator(length: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = String(control.value).trim();
    const digitsOnly = /^\d+$/.test(value);

    if (!digitsOnly) {
      return { notDigitsOnly: true };
    }

    if (value.length !== length) {
      return { exactDigits: { requiredLength: length, actualLength: value.length } };
    }

    return null;
  };
}
