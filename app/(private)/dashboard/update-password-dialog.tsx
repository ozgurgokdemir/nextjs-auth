'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { passwordSchema } from '@/lib/auth/definitions';
import { updateUserPassword } from './actions';

const updatePasswordSchema = z.object({
  password: passwordSchema,
});
type UpdatePassword = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordDialog({
  children,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<UpdatePassword>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
    },
  });

  async function onSubmit({ password }: UpdatePassword) {
    startTransition(async () => {
      const { status, message } = await updateUserPassword(password);
      if (status === 'error') form.setError('password', { message });
      if (status === 'success') setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (open) form.reset();
      }}
      {...props}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set new password</DialogTitle>
          <DialogDescription>
            Enter a new password below to change your password.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput
                      id="password"
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            className="w-full"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              'Update password'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
