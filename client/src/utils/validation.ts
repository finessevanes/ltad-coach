import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const registerSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const athleteSchema = yup.object({
  name: yup.string().max(100, 'Name must be 100 characters or less').required('Name is required'),
  age: yup
    .number()
    .min(5, 'Age must be at least 5')
    .max(13, 'Age must be 13 or less')
    .required('Age is required'),
  gender: yup
    .string()
    .oneOf(['male', 'female'], 'Invalid gender selection')
    .required('Gender is required'),
  parentEmail: yup
    .string()
    .email('Invalid email address')
    .required('Parent email is required'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type AthleteFormData = yup.InferType<typeof athleteSchema>;
