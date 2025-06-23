'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogClose,
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
import { useTwoFactor } from '@/components/two-factor-provider';

const updatePasswordSchema = z.object({
  password: passwordSchema,
});
type UpdatePassword = z.infer<typeof updatePasswordSchema>;

interface UpdatePasswordDialogProps
  extends React.ComponentProps<typeof Dialog> {
  hasPassword: boolean;
}

export function UpdatePasswordDialog({
  hasPassword,
  children,
  ...props
}: UpdatePasswordDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<UpdatePassword>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
    },
  });

  const { startVerification } = useTwoFactor();

  async function onSubmit({ password }: UpdatePassword) {
    startTransition(async () => {
      const { status, message, requires2FA } = await updateUserPassword(
        password
      );
      if (requires2FA) {
        startVerification(async () => {
          startTransition(async () => {
            const { status, message } = await updateUserPassword(password);
            if (status === 'error') form.setError('password', { message });
            if (status === 'success') setOpen(false);
          });
        });
      }
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
          <DialogTitle>
            {hasPassword ? 'Change your password' : 'Set your password'}
          </DialogTitle>
          <DialogDescription>
            {hasPassword
              ? 'Update your password to keep your account secure. Make sure it’s strong and easy for you to remember.'
              : 'Create a secure password to protect your account. Make sure it’s strong and easy for you to remember.'}
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
                      placeholder={
                        hasPassword
                          ? 'Enter your new password'
                          : 'Enter your password'
                      }
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
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {(() => {
              if (isPending) return <Loader2 className="animate-spin" />;
              return hasPassword ? 'Update' : 'Create';
            })()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
