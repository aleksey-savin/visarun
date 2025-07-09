import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

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
import { Textarea } from '@/components/ui/textarea';

import { SquarePen, MessageSquareDiff } from 'lucide-react';
import { trpc } from '@/lib/trpcProvider';
import { getMessageTemplatesRoute } from '@/lib/routes';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox.tsx';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

// Define the exact schema from backend, enforcing non-optional roles
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

const CreateMessageTemplatePage = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMessageTemplateMutation = trpc.messageTemplate.create.useMutation();

  const { data: telegramChannelsData } = trpc.telegramChannel.getAll.useQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
      telegramChannels: [],
    },
  });

  async function onSubmit(values: FormData) {
    try {
      setIsSubmitting(true);

      await createMessageTemplateMutation.mutateAsync({
        title: values.title,
        body: values.body,
        telegramChannels: values.telegramChannels,
      });
      navigate(getMessageTemplatesRoute());
    } catch (error) {
      console.error('Error creating message template:', error);
      if (error instanceof Error) {
        alert(`Failed to create message template: ${error.message}`);
      } else {
        alert('Failed to create message template due to an unknown error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-3">
        <MessageSquareDiff className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Create New Message Template</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-6">
                  <div>
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

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body</FormLabel>
                        <FormControl>
                          <SimpleEditor
                            className="selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="min-w-32">
                    {isSubmitting ? 'Creating...' : 'Create Template'}
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
                        const isChecked =
                          field.value.filter(
                            (targetChannel: { id: string }) => targetChannel.id === channel.id
                          ).length > 0;
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
                                field.onChange([...field.value, { id: channel.id }]);
                              }
                            }}
                          >
                            <Checkbox
                              className="mt-0.5 cursor-pointer"
                              id={channel.id}
                              checked={isChecked}
                              onCheckedChange={checked => {
                                if (checked) {
                                  field.onChange([...field.value, { id: channel.id }]);
                                } else {
                                  field.onChange(
                                    field.value.filter(
                                      (targetChannel: { id: string }) =>
                                        targetChannel.id !== channel.id
                                    )
                                  );
                                }
                              }}
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
};

export default CreateMessageTemplatePage;
