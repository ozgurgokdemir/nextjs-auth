'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { sendPasswordReset } from '@/lib/auth/actions';
import { emailSchema } from '@/lib/auth/definitions';

const passwordResetSchema = z.object({
  email: emailSchema,
});
type PasswordReset = z.infer<typeof passwordResetSchema>;

export function PasswordResetForm(props: React.ComponentProps<typeof Card>) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<PasswordReset>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit({ email }: PasswordReset) {
    startTransition(async () => {
      const { status, message } = await sendPasswordReset(email);
      if (status === 'error') toast.error(message);
      if (status === 'success') toast.success(message);
    });
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          {`Enter your email address and we'll send you a link to reset your
          password.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      autoComplete="email"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : 'Send Link'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
