'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { otpSchema } from '@/lib/auth/definitions';
import { useCountdown } from '@/hooks/countdown';
import { deleteAccount, sendDeleteAccount } from './actions';

let initialOpen = true;

const deleteAccountSchema = z.object({
  code: otpSchema,
});
type DeleteAccount = z.infer<typeof deleteAccountSchema>;

interface DeleteAccountDialogProps extends React.ComponentProps<typeof Dialog> {
  email: string;
}

export function DeleteAccountDialog({
  email,
  children,
  ...props
}: DeleteAccountDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const { countdown, startCountdown, resetCountdown } =
    useCountdown('delete_account');

  const form = useForm<DeleteAccount>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      code: '',
    },
  });

  async function onSubmit({ code }: DeleteAccount) {
    startTransition(async () => {
      const { error } = await deleteAccount(code);
      if (error) toast.error(error);
    });
  }

  async function handleResend() {
    if (countdown > 0) return;
    startCountdown();
    const { error } = await sendDeleteAccount();
    if (error) {
      toast.error(error);
      resetCountdown();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={async (open) => {
        setOpen(open);
        if (open) {
          form.reset();
          if (initialOpen) {
            await handleResend();
            initialOpen = false;
          }
        }
      }}
      {...props}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detele your account</DialogTitle>
          <DialogDescription className="line-clamp-2">
            This action cannot be undone. To confirm, Please enter the
            verification code we have sent to{' '}
            <span className="font-medium break-all">{email}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP
                      autoFocus
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      disabled={isPending}
                      {...field}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Didn't receive a code?{' '}
                    <Button
                      className="p-0 h-auto"
                      variant="link"
                      onClick={handleResend}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `Resend (${countdown})` : 'Resend'}
                    </Button>
                  </FormDescription>
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
            variant="destructive"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending ? <Loader2 className="animate-spin" /> : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
