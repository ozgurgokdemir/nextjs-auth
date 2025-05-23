'use client';

import * as React from 'react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { resendEmailVerification, verifyEmail } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';

const RESEND_COUNTDOWN_SECONDS = 30;

interface EmailVerificationFormProps extends React.ComponentProps<'div'> {
  email: string;
}

export function EmailVerificationForm({
  email,
  className,
  ...props
}: EmailVerificationFormProps) {
  const [countdown, setCountdown] = React.useState(RESEND_COUNTDOWN_SECONDS);
  const [isPending, startTransition] = React.useTransition();

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
      const { error } = await verifyEmail({ email, code });
      if (error) toast.error(error);
    });
  }

  async function handleResend() {
    if (countdown > 0) return;
    setCountdown(RESEND_COUNTDOWN_SECONDS);
    const { status, message } = await resendEmailVerification(email);
    if (status === 'error') toast.error(message);
    if (status === 'success') toast.success(message);
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Verify your email</CardTitle>
          <CardDescription>
            Enter the verification code we have sent to{' '}
            <span className="font-medium">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InputOTP
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
        </CardContent>
        <CardFooter>
          <CardDescription>
            Didn't receive a code?{' '}
            <Button
              className="p-0 h-auto"
              variant="link"
              onClick={handleResend}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Resend (${countdown})` : 'Resend'}
            </Button>
          </CardDescription>
        </CardFooter>
      </Card>
    </div>
  );
}
