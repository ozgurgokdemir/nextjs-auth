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
import { Button } from '@/components/ui/button';
import { resendEmailVerification, verifyEmail } from '@/lib/auth/actions';
import { useCountdown } from '@/hooks/countdown';
import { cn } from '@/lib/utils';

interface EmailVerificationFormProps extends React.ComponentProps<'div'> {
  email: string;
}

export function EmailVerificationForm({
  email,
  className,
  ...props
}: EmailVerificationFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const { countdown, startCountdown, resetCountdown } =
    useCountdown('email_verification');

  async function handleVerification(code: string) {
    startTransition(async () => {
      const { error } = await verifyEmail({ email, code });
      if (error) toast.error(error);
    });
  }

  async function handleResend() {
    if (countdown > 0) return;
    startCountdown();
    const { error } = await resendEmailVerification(email);
    if (error) {
      toast.error(error);
      resetCountdown();
    }
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
