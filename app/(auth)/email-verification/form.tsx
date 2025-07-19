'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { resendEmailVerification, verifyEmail } from '@/lib/auth/actions';
import {
  emailVerificationSchema,
  EmailVerification,
} from '@/lib/auth/definitions';
import { useCountdown } from '@/hooks/countdown';

interface EmailVerificationFormProps extends React.ComponentProps<typeof Card> {
  email: string;
}

export function EmailVerificationForm({
  email,
  className,
  ...props
}: EmailVerificationFormProps) {
  const [shouldFocus, setShouldFocus] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const countdown = useCountdown({ key: 'email_verification' });

  const form = useForm<EmailVerification>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email,
      code: '',
    },
  });

  React.useEffect(() => {
    countdown.start();
  }, []);

  React.useEffect(() => {
    if (shouldFocus && !isPending) {
      form.setFocus('code');
      setShouldFocus(false);
    }
  }, [shouldFocus, isPending]);

  async function handleResend() {
    if (countdown.isRunning) return;

    countdown.start();

    const { error } = await resendEmailVerification(email);
    if (error) {
      toast.error(error);
      countdown.reset();
    }
  }

  async function onSubmit(values: EmailVerification) {
    startTransition(async () => {
      const { error } = await verifyEmail(values);
      if (error) {
        toast.error(error);
        form.reset();
        setShouldFocus(true);
      }
    });
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="text-xl">Verify your email</CardTitle>
        <CardDescription>
          Enter the verification code we have sent to{' '}
          <span className="font-medium">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      disabled={countdown.isRunning}
                      onClick={handleResend}
                    >
                      {countdown.isRunning
                        ? `Resend (${countdown.time})`
                        : 'Resend'}
                    </Button>
                  </FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={isPending}
          onClick={form.handleSubmit(onSubmit)}
        >
          {isPending ? <Loader2 className="animate-spin" /> : 'Continue'}
        </Button>
      </CardFooter>
    </Card>
  );
}
