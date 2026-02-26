/**
 * Password validation utility
 * Backend requirement: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const PASSWORD_REQUIREMENTS = {
  minLength: { regex: /.{8,}/, label: 'At least 8 characters' },
  uppercase: { regex: /[A-Z]/, label: 'At least 1 uppercase letter (A-Z)' },
  lowercase: { regex: /[a-z]/, label: 'At least 1 lowercase letter (a-z)' },
  number: { regex: /\d/, label: 'At least 1 number (0-9)' },
  special: { regex: /[@$!%*?&]/, label: 'At least 1 special character (@$!%*?&)' }
};

/**
 * Validate password against all requirements
 * @param {string} password - The password to validate
 * @returns {object} - { isValid: boolean, errors: array, checklist: object }
 */
export const validatePassword = (password) => {
  const checklist = {};
  const errors = [];

  Object.entries(PASSWORD_REQUIREMENTS).forEach(([key, requirement]) => {
    const isValid = requirement.regex.test(password);
    checklist[key] = isValid;
    if (!isValid) {
      errors.push(requirement.label);
    }
  });

  return {
    isValid: PASSWORD_REGEX.test(password),
    errors,
    checklist
  };
};

/**
 * Get password strength level (weak, fair, good, strong)
 * @param {string} password - The password to check
 * @returns {string} - Strength level
 */
export const getPasswordStrength = (password) => {
  const { checklist } = validatePassword(password);
  const passedChecks = Object.values(checklist).filter(Boolean).length;

  if (passedChecks === 0) return 'weak';
  if (passedChecks <= 2) return 'fair';
  if (passedChecks <= 4) return 'good';
  return 'strong';
};
