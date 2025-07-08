// src/pages/users/EditUserPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { trpc } from '@/lib/trpcProvider';
import { getMessageTemplatesRoute } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { SquarePen, MessageSquareDiff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';

// Schema for form validation
const formSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1),
  telegramChannels: z.array(z.object({ id: z.string() })).min(0),
});

// Use explicit interface for form data
interface FormData {
  title: string;
  body: string;
  telegramChannels: { id: string }[];
}

export default function EditMessageTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: messageTemplateData, isLoading: isMessageTemplateLoading } =
    trpc.messageTemplate.getOne.useQuery(
      { id: id! },
      {
        retry: 1,
      }
    );

  // Mutations
  const editMutation = trpc.messageTemplate.edit.useMutation();

  const { data: telegramChannelsData } = trpc.telegramChannel.getAll.useQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
      telegramChannels: [],
    },
  });

  useEffect(() => {
    if (!messageTemplateData) return;

    form.reset({
      title: messageTemplateData.messageTemplate.title,
      body: messageTemplateData.messageTemplate.body,
      telegramChannels: messageTemplateData.messageTemplate.telegramChannels,
    });
  }, [messageTemplateData, form]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true);
      setError(null);

      await editMutation.mutateAsync({
        id: id!,
        title: values.title,
        body: values.body,
      });
      navigate(getMessageTemplatesRoute());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update message template: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isMessageTemplateLoading) return <div>Loading message template...</div>;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-3">
        <MessageSquareDiff className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Edit Message Template</h1>
      </div>

      {error && (
        <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Message Template Information</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Body */}
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter body" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="min-w-32">
                    {isSubmitting ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(getMessageTemplatesRoute())}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Telegram Channels Section - Right Column */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <SquarePen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Assign Channels</h2>
            </div>

            {telegramChannelsData?.channels?.length == 0 && <p>No channels have been added yet!</p>}

            <Form {...form}>
              <FormField
                control={form.control}
                name="telegramChannels"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-4">
                      {telegramChannelsData?.channels.map(channel => {
                        const isChecked = field.value.includes({ id: channel.id });
                        return (
                          <div
                            key={channel.id}
                            className={`
                              flex items-start p-4 border-2 rounded-lg transition-all cursor-pointer hover:bg-accent/50
                              ${isChecked ? 'border-primary bg-primary/5' : 'border-border'}
                            `}
                            onClick={() => {
                              if (isChecked) {
                                field.onChange(
                                  field.value.filter(
                                    (targetChannel: { id: string }) =>
                                      targetChannel.id !== channel.id
                                  )
                                );
                              } else {
                                field.onChange([...field.value, channel.id]);
                              }
                            }}
                          >
                            <Checkbox
                              id={channel.id}
                              checked={isChecked}
                              onCheckedChange={checked => {
                                if (checked) {
                                  field.onChange([...field.value, channel.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter(
                                      (targetChannel: { id: string }) =>
                                        targetChannel.id !== channel.id
                                    )
                                  );
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div className="ml-3 flex-1">
                              <label
                                htmlFor={channel.id}
                                className="text-sm font-medium leading-tight cursor-pointer"
                              >
                                {channel.chatTitle ? channel.chatTitle : 'Null'}
                              </label>
                              {channel.chatUsername && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {channel.chatUsername}
                                </p>
                              )}
                            </div>
                            {isChecked && (
                              <div className="ml-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
