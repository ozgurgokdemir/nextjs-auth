'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { sendTwoFactor, verifyTwoFactor } from '@/lib/auth/actions';
import { twoFactorSchema, TwoFactor } from '@/lib/auth/definitions';
import { Callback } from './two-factor-provider';

const RESEND_COUNTDOWN_SECONDS = 30;

interface TwoFactorDialogProps extends React.ComponentProps<typeof Dialog> {
  open: boolean;
  setOpen: (open: boolean) => void;
  onVerify: Callback;
}

export function TwoFactorDialog({
  open,
  setOpen,
  onVerify,
  ...props
}: TwoFactorDialogProps) {
  const [shouldFocus, setShouldFocus] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<TwoFactor>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset();
      (async () => {
        await handleResend();
      })();
    }
  }, [open]);

  React.useEffect(() => {
    if (shouldFocus && !isPending) {
      form.setFocus('code');
      setShouldFocus(false);
    }
  }, [shouldFocus, isPending]);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((current) => current - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  async function handleResend() {
    if (countdown > 0) return;
    setCountdown(RESEND_COUNTDOWN_SECONDS);
    const { error } = await sendTwoFactor();
    if (error) toast.error(error);
  }

  async function onSubmit(values: TwoFactor) {
    startTransition(async () => {
      const { error } = await verifyTwoFactor(values);
      if (error) {
        toast.error(error);
        form.reset();
        setShouldFocus(true);
      } else {
        setOpen(false);
        await onVerify();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} {...props}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Two-factor authentication</DialogTitle>
          <DialogDescription>
            Enter the verification code sent to your email.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                      onComplete={form.handleSubmit(onSubmit)}
                      {...field}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={1} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={4} />
                      </InputOTPGroup>
                      <InputOTPGroup>
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
                      disabled={countdown > 0}
                      onClick={handleResend}
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
          <Button
            className="w-full"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending ? <Loader2 className="animate-spin" /> : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
