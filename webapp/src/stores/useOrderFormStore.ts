import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { z } from 'zod';

// Form schema
export const orderSchema = z.object({
  contactMethodId: z.string().min(1, 'Contact method is required'),
  contactValue: z.string().min(1, 'Contact information is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  citizenshipId: z.string().optional(),
  passportExpirationDate: z.date().optional().nullable(),
});

export type OrderFormData = z.infer<typeof orderSchema>;

export interface OrderFormState {
  // Form data
  formData: OrderFormData;

  // Validation state
  errors: Record<string, string>;
  isValid: boolean;

  // Auto-save state
  isDirty: boolean;
  lastAutoSaveTime: Date | null;
  autoSaveTimeoutId: NodeJS.Timeout | null;

  // Actions
  setFormData: (data: Partial<OrderFormData>) => void;
  updateField: <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  setIsValid: (isValid: boolean) => void;
  setIsDirty: (isDirty: boolean) => void;
  setLastAutoSaveTime: (time: Date | null) => void;
  setAutoSaveTimeoutId: (id: NodeJS.Timeout | null) => void;

  // Validation
  validateForm: () => boolean;
  validateField: (field: keyof OrderFormData, value: any) => string | null;

  // Reset
  resetForm: () => void;
  resetToDefaults: () => void;
}

const defaultFormData: OrderFormData = {
  contactMethodId: '',
  contactValue: '',
  firstName: '',
  lastName: '',
  citizenshipId: 'none',
  passportExpirationDate: null,
};

const initialState = {
  formData: defaultFormData,
  errors: {},
  isValid: false,
  isDirty: false,
  lastAutoSaveTime: null,
  autoSaveTimeoutId: null,
};

export const useOrderFormStore = create<OrderFormState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setFormData: data =>
        set(
          state => ({
            formData: { ...state.formData, ...data },
            isDirty: true,
          }),
          false,
          'setFormData'
        ),

      updateField: (field, value) =>
        set(
          state => {
            const newFormData = { ...state.formData, [field]: value };
            // Validate field without calling get() during set()
            let fieldError = null;
            try {
              const fieldSchema = orderSchema.shape[field];
              if (fieldSchema) {
                fieldSchema.parse(value);
              }
            } catch (error) {
              if (error instanceof z.ZodError) {
                fieldError = error.errors[0]?.message || 'Invalid value';
              } else {
                fieldError = 'Invalid value';
              }
            }

            const newErrors = { ...state.errors };
            if (fieldError) {
              newErrors[field] = fieldError;
            } else {
              delete newErrors[field];
            }

            return {
              formData: newFormData,
              errors: newErrors,
              isDirty: true,
              isValid: Object.keys(newErrors).length === 0,
            };
          },
          false,
          'updateField'
        ),

      setErrors: errors =>
        set({ errors, isValid: Object.keys(errors).length === 0 }, false, 'setErrors'),

      clearErrors: () => set({ errors: {}, isValid: true }, false, 'clearErrors'),

      setFieldError: (field, error) =>
        set(
          state => {
            const newErrors = { ...state.errors, [field]: error };
            return {
              errors: newErrors,
              isValid: Object.keys(newErrors).length === 0,
            };
          },
          false,
          'setFieldError'
        ),

      clearFieldError: field =>
        set(
          state => {
            const newErrors = { ...state.errors };
            delete newErrors[field];
            return {
              errors: newErrors,
              isValid: Object.keys(newErrors).length === 0,
            };
          },
          false,
          'clearFieldError'
        ),

      setIsValid: isValid => set({ isValid }, false, 'setIsValid'),

      setIsDirty: isDirty => set({ isDirty }, false, 'setIsDirty'),

      setLastAutoSaveTime: lastAutoSaveTime =>
        set({ lastAutoSaveTime }, false, 'setLastAutoSaveTime'),

      setAutoSaveTimeoutId: autoSaveTimeoutId =>
        set(
          state => {
            // Clear existing timeout if setting a new one
            if (state.autoSaveTimeoutId && autoSaveTimeoutId !== state.autoSaveTimeoutId) {
              clearTimeout(state.autoSaveTimeoutId);
            }
            return { autoSaveTimeoutId };
          },
          false,
          'setAutoSaveTimeoutId'
        ),

      // Validation
      validateForm: () => {
        const { formData } = get();
        try {
          orderSchema.parse(formData);
          set({ errors: {}, isValid: true }, false, 'validateForm');
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const newErrors: Record<string, string> = {};
            error.errors.forEach(err => {
              if (err.path.length > 0) {
                newErrors[err.path[0] as string] = err.message;
              }
            });
            set({ errors: newErrors, isValid: false }, false, 'validateForm');
            return false;
          }
          return false;
        }
      },

      validateField: (field, value) => {
        try {
          const fieldSchema = orderSchema.shape[field];
          if (fieldSchema) {
            fieldSchema.parse(value);
          }
          return null;
        } catch (error) {
          if (error instanceof z.ZodError) {
            return error.errors[0]?.message || 'Invalid value';
          }
          return 'Invalid value';
        }
      },

      // Reset
      resetForm: () =>
        set(
          state => {
            // Clear auto-save timeout
            if (state.autoSaveTimeoutId) {
              clearTimeout(state.autoSaveTimeoutId);
            }
            return initialState;
          },
          false,
          'resetForm'
        ),

      resetToDefaults: () =>
        set(
          state => {
            // Clear auto-save timeout
            if (state.autoSaveTimeoutId) {
              clearTimeout(state.autoSaveTimeoutId);
            }
            return {
              ...initialState,
              formData: defaultFormData,
            };
          },
          false,
          'resetToDefaults'
        ),
    }),
    {
      name: 'order-form-store',
    }
  )
);

// Selector hooks for better performance
export const useFormData = () => useOrderFormStore(state => state.formData);
export const useFormErrors = () => useOrderFormStore(state => state.errors);

// Cache selectors to prevent infinite loops
const selectValidation = (state: OrderFormState) => ({
  isValid: state.isValid,
  errors: state.errors,
  validateForm: state.validateForm,
  validateField: state.validateField,
});

const selectActions = (state: OrderFormState) => ({
  setFormData: state.setFormData,
  updateField: state.updateField,
  setErrors: state.setErrors,
  clearErrors: state.clearErrors,
  setFieldError: state.setFieldError,
  clearFieldError: state.clearFieldError,
  resetForm: state.resetForm,
  resetToDefaults: state.resetToDefaults,
});

export const useFormValidation = () => useOrderFormStore(selectValidation);
export const useFormActions = () => useOrderFormStore(selectActions);
