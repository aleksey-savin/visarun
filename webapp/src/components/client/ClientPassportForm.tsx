import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { format } from 'date-fns';

const clientPassportSchema = z.object({
  expirationDate: z.string().min(1, 'Expiration date is required'),
  scanPath: z.string().min(1, 'Scan file is required'),
});

type ClientPassportFormData = {
  expirationDate: string;
  scanPath: string;
};

interface ClientPassportFormProps {
  clientId: string;
  passportId?: string; // For editing existing passport
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ClientPassportForm = ({
  clientId,
  passportId,
  onSuccess,
  onCancel,
}: ClientPassportFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isEditing = !!passportId;

  const form = useForm<ClientPassportFormData>({
    resolver: zodResolver(clientPassportSchema),
    defaultValues: {
      expirationDate: '',
      scanPath: '',
    },
  });

  // Get existing passport data if editing
  const { data: passportData } = trpc.clientPassport.getOne.useQuery(
    { id: passportId! },
    { enabled: isEditing }
  );

  // Set form values when passport data is loaded
  React.useEffect(() => {
    if (passportData?.clientPassport && isEditing) {
      form.setValue(
        'expirationDate',
        format(new Date(passportData.clientPassport.expirationDate), 'yyyy-MM-dd')
      );
      form.setValue('scanPath', passportData.clientPassport.scanPath);
    }
  }, [passportData, form, isEditing]);

  // Create passport mutation
  const createPassportMutation = trpc.clientPassport.create.useMutation({
    onSuccess: () => {
      toast.success('Passport added successfully');
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: error => {
      toast.error('Failed to add passport', {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Edit passport mutation
  const editPassportMutation = trpc.clientPassport.edit.useMutation({
    onSuccess: () => {
      toast.success('Passport updated successfully');
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: error => {
      toast.error('Failed to update passport', {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handle file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload JPG, PNG, or PDF files only.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size too large. Please upload files smaller than 10MB.');
        return;
      }

      setSelectedFile(file);
      setUploadProgress(0);

      try {
        // Upload file to server
        const formData = new FormData();
        formData.append('passport', file);

        const uploadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/upload/passport`;
        console.log('Uploading to:', uploadUrl);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        console.log('Upload response status:', uploadResponse.status);
        console.log(
          'Upload response headers:',
          Object.fromEntries(uploadResponse.headers.entries())
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload failed with response:', errorText);
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        const result = await uploadResponse.json();
        console.log('Upload result:', result);

        if (result.success) {
          setUploadProgress(100);
          form.setValue('scanPath', result.filePath);
          toast.success('File uploaded successfully');
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        setSelectedFile(null);
        setUploadProgress(0);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    form.setValue('scanPath', '');
  };

  const onSubmit = (data: ClientPassportFormData) => {
    setIsSubmitting(true);

    if (isEditing && passportId) {
      editPassportMutation.mutate({
        id: passportId,
        expirationDate: data.expirationDate,
        scanPath: data.scanPath,
      });
    } else {
      createPassportMutation.mutate({
        clientId,
        expirationDate: data.expirationDate,
        scanPath: data.scanPath,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="expirationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value || ''}
                  onChange={e => {
                    field.onChange(e.target.value);
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </FormControl>
              <FormDescription>When does the passport expire?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scanPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passport Scan</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {!selectedFile && !field.value ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Upload passport scan</p>
                        <p className="text-xs text-gray-500">JPG, PNG, or PDF files up to 10MB</p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="passport-file"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('passport-file')?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <Upload className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {selectedFile ? selectedFile.name : 'Existing file'}
                            </p>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="mt-2">
                                <div className="bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Uploading... {uploadProgress}%
                                </p>
                              </div>
                            )}
                            {uploadProgress === 100 && (
                              <p className="text-xs text-green-600 mt-1">Upload complete</p>
                            )}
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>Upload a clear scan or photo of the passport</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || (uploadProgress > 0 && uploadProgress < 100)}
          >
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Adding...'
              : isEditing
                ? 'Update Passport'
                : 'Add Passport'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
