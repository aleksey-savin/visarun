import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ContactMethodIcon } from '@/components/ContactMethod';
// import { useFormActions } from '@/stores';

interface ContactMethod {
  id: string;
  name: string;
  icon?: string | null;
}

interface ContactSectionProps {
  form: UseFormReturn<any>;
  contactMethods: ContactMethod[];
  contactMethodsLoading: boolean;
  contactMethodsError: any;
  orderUserId?: string;
  onAutoSave: (data: any, fieldType: 'user' | 'client' | 'both') => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  form,
  contactMethods,
  contactMethodsLoading,
  contactMethodsError,
  orderUserId,
  onAutoSave,
}) => {
  // const { updateField } = useFormActions();
  return (
    <div>
      <Label className="text-sm mb-2">Contact</Label>
      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="contactMethodId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  key={`contact-method-${orderUserId}-${field.value}`}
                  onValueChange={value => {
                    field.onChange(value);
                    // Auto-save when contact method type changes
                    const formData = form.getValues();
                    formData.contactMethodId = value; // Ensure the new value is used
                    // Auto-save if we have both method and value
                    if (formData.contactMethodId && formData.contactValue?.trim()) {
                      onAutoSave(formData, 'user');
                    }
                  }}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        <span>
                          Select type <span className="text-red-500">*</span>
                        </span>
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {contactMethodsLoading ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                    ) : contactMethodsError ? (
                      <div className="px-2 py-1.5 text-sm text-destructive">
                        Error loading contact methods
                      </div>
                    ) : contactMethods.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No contact methods available
                      </div>
                    ) : (
                      contactMethods.map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <ContactMethodIcon method={method} className="w-4 h-4" />
                            {method.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactValue"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Input
                    className="w-auto"
                    placeholder="phone / @username / e-mail"
                    {...field}
                    onChange={e => {
                      field.onChange(e);
                    }}
                    onBlur={() => {
                      // Auto-save when contact value field is blurred
                      const formData = form.getValues();
                      if (formData.contactMethodId && formData.contactValue) {
                        onAutoSave(formData, 'user');
                      }
                    }}
                  />
                  {!field.value && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none">
                      *
                    </span>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
