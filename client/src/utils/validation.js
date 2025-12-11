// Email validation
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return 'Email is required';
  }
  if (!re.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

// Required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

// Age validation
export const validateAge = (age) => {
  const ageNum = parseInt(age, 10);
  if (!age) {
    return 'Age is required';
  }
  if (isNaN(ageNum)) {
    return 'Please enter a valid age';
  }
  if (ageNum < 5 || ageNum > 18) {
    return 'Age must be between 5 and 18';
  }
  return null;
};

// Name validation
export const validateName = (name, fieldName = 'Name') => {
  if (!name || name.trim() === '') {
    return `${fieldName} is required`;
  }
  if (name.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }
  if (name.length > 50) {
    return `${fieldName} must not exceed 50 characters`;
  }
  return null;
};

// Phone validation
export const validatePhone = (phone) => {
  if (!phone) {
    return 'Phone number is required';
  }
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  return null;
};

// Form validation helper
export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const validators = Array.isArray(rules[field]) ? rules[field] : [rules[field]];

    for (const validator of validators) {
      const error = validator(values[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

// Password confirmation validation
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};
