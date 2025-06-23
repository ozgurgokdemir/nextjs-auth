'use client';

import * as React from 'react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { sendTwoFactor, verifyTwoFactor } from '@/lib/auth/actions';
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
  const [value, setValue] = React.useState('');
  const [countdown, setCountdown] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setValue('');
      (async () => {
        await handleResend();
      })();
    }
  }, [open]);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((current) => current - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  async function handleVerification(code: string) {
    startTransition(async () => {
      const { error } = await verifyTwoFactor(code);
      if (error) {
        toast.error(error);
        return;
      }
      setOpen(false);
      await onVerify();
    });
  }

  async function handleResend() {
    if (countdown > 0) return;
    setCountdown(RESEND_COUNTDOWN_SECONDS);
    const { status, message } = await sendTwoFactor();
    if (status === 'error') toast.error(message);
    if (status === 'success') toast.success(message);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} {...props}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Two-factor authentication</DialogTitle>
          <DialogDescription>
            Enter the verification code we have sent to your email.
          </DialogDescription>
        </DialogHeader>
        <InputOTP
          value={value}
          onChange={setValue}
          autoFocus
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          disabled={isPending}
          onComplete={handleVerification}
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
        <DialogFooter className="sm:justify-start">
          <DialogDescription>
            Didn't receive a code?{' '}
            <Button
              className="p-0 h-auto"
              variant="link"
              onClick={handleResend}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Resend (${countdown})` : 'Resend'}
            </Button>
          </DialogDescription>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
