import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom form validators for the application
 */
export class FormValidators {
  /**
   * Validator for minimum value with custom error message
   * @param min Minimum allowed value
   * @param errorMessage Custom error message
   * @returns Validator function
   */
  static minValue(min: number, errorMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null; // Don't validate empty values to allow optional controls
      }
      
      const numericValue = Number(value);
      if (isNaN(numericValue) || numericValue < min) {
        return {
          minValue: {
            min: min,
            actual: value,
            message: errorMessage || `Value must be at least ${min}`
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for maximum value with custom error message
   * @param max Maximum allowed value
   * @param errorMessage Custom error message
   * @returns Validator function
   */
  static maxValue(max: number, errorMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      const numericValue = Number(value);
      if (isNaN(numericValue) || numericValue > max) {
        return {
          maxValue: {
            max: max,
            actual: value,
            message: errorMessage || `Value must be at most ${max}`
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for decimal places
   * @param maxDecimals Maximum number of decimal places
   * @returns Validator function
   */
  static maxDecimals(maxDecimals: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      const stringValue = value.toString();
      const decimalIndex = stringValue.indexOf('.');
      
      if (decimalIndex !== -1) {
        const decimals = stringValue.length - decimalIndex - 1;
        if (decimals > maxDecimals) {
          return {
            maxDecimals: {
              max: maxDecimals,
              actual: decimals,
              message: `Maximum ${maxDecimals} decimal places allowed`
            }
          };
        }
      }
      
      return null;
    };
  }

  /**
   * Validator for future date restriction
   * @param errorMessage Custom error message
   * @returns Validator function
   */
  static noFutureDate(errorMessage?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (date > today) {
        return {
          futureDate: {
            message: errorMessage || 'Future dates are not allowed'
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for date range
   * @param startDate Start date control name
   * @param endDate End date control name
   * @returns Validator function
   */
  static dateRange(startDateControlName: string, endDateControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const start = group.get(startDateControlName)?.value;
      const end = group.get(endDateControlName)?.value;
      
      if (!start || !end) {
        return null;
      }
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (startDate > endDate) {
        return {
          dateRange: {
            message: 'End date must be after start date'
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for required if another field has value
   * @param otherFieldName Name of the other field
   * @returns Validator function
   */
  static requiredIf(otherFieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }
      
      const otherField = control.parent.get(otherFieldName);
      if (!otherField) {
        return null;
      }
      
      const otherValue = otherField.value;
      const thisValue = control.value;
      
      if (otherValue && (!thisValue || thisValue === '')) {
        return {
          requiredIf: {
            otherField: otherFieldName,
            message: `This field is required when ${otherFieldName} has a value`
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validator for stock symbol format
   * @returns Validator function
   */
  static stockSymbol(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      
      // Stock symbols should be 1-5 uppercase letters
      const pattern = /^[A-Z]{1,5}$/;
      if (!pattern.test(value)) {
        return {
          stockSymbol: {
            message: 'Stock symbol must be 1-5 uppercase letters'
          }
        };
      }
      
      return null;
    };
  }
}