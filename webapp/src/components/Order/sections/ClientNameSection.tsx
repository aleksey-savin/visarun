import React, { useCallback, useRef, memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

interface ClientNameSectionProps {
  form: UseFormReturn<{
    contactMethodId: string;
    contactValue: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    passportExpirationDate?: Date | null | undefined;
    citizenshipId?: string | undefined;
  }>;
  onAutoSave: (
    data: {
      contactMethodId: string;
      contactValue: string;
      firstName?: string | undefined;
      lastName?: string | undefined;
      passportExpirationDate?: Date | null | undefined;
      citizenshipId?: string | undefined;
    },
    fieldType: 'user' | 'client' | 'both'
  ) => void;
}

export const ClientNameSection: React.FC<ClientNameSectionProps> = memo(({ form, onAutoSave }) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<{ firstName: string; lastName: string } | null>(null);

  // Prevent unnecessary re-renders by not subscribing to form state changes
  const isFormDataChangedRef = useRef(false);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      // Only get form data when actually saving
      const formData = form.getValues();
      const currentData = {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
      };

      // Only save if data has actually changed
      const lastSaved = lastSavedDataRef.current;
      if (
        !lastSaved ||
        lastSaved.firstName !== currentData.firstName ||
        lastSaved.lastName !== currentData.lastName
      ) {
        lastSavedDataRef.current = currentData;
        onAutoSave(formData, 'both');
      }

      isFormDataChangedRef.current = false;
    }, 1000); // 1 second debounce
  }, [form, onAutoSave]);

  // Optimized blur handler that doesn't recreate on each render
  const handleBlur = useCallback(() => {
    if (isFormDataChangedRef.current) {
      debouncedAutoSave();
    }
  }, [debouncedAutoSave]);

  // Track changes without causing re-renders
  const handleChange = useCallback(
    (field: { onChange: (value: string) => void }, value: string) => {
      field.onChange(value);
      isFormDataChangedRef.current = true;
    },
    []
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div>
      <Label className="text-sm mb-2">Full name</Label>
      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="First Name"
                  value={field.value || ''}
                  onChange={e => handleChange(field, e.target.value)}
                  onBlur={handleBlur}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Last Name"
                  value={field.value || ''}
                  onChange={e => handleChange(field, e.target.value)}
                  onBlur={handleBlur}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});

ClientNameSection.displayName = 'ClientNameSection';
