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
import { useCountdown } from '@/hooks/countdown';
import { Callback } from './two-factor-provider';

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
  const [isPending, startTransition] = React.useTransition();
  const countdown = useCountdown({ key: 'two_factor' });

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

  async function handleResend() {
    if (countdown.isRunning) return;

    countdown.start();

    const { error } = await sendTwoFactor();
    if (error) {
      toast.error(error);
      countdown.reset();
    }
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Two-factor authentication</DialogTitle>
          <DialogDescription>
            Enter the verification code sent to your email.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
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
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : 'Continue'}
            </Button>
          </form>
        </Form>
        <DialogFooter>
          <DialogDescription>
            {`Didn't receive a code?`}{' '}
            <Button
              className="p-0 h-auto font-normal"
              variant="link"
              disabled={countdown.isRunning}
              onClick={handleResend}
            >
              {countdown.isRunning ? `Resend (${countdown.time})` : 'Resend'}
            </Button>
          </DialogDescription>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
