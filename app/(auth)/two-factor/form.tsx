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
import { sendTwoFactor, verifyTwoFactor } from '@/lib/auth/actions';
import { twoFactorSchema, TwoFactor } from '@/lib/auth/definitions';
import { useCountdown } from '@/hooks/countdown';

export function TwoFactorForm(props: React.ComponentProps<typeof Card>) {
  const [shouldFocus, setShouldFocus] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const { countdown, startCountdown, resetCountdown } =
    useCountdown('two_factor');

  const form = useForm<TwoFactor>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  React.useEffect(() => {
    if (shouldFocus && !isPending) {
      form.setFocus('code');
      setShouldFocus(false);
    }
  }, [shouldFocus, isPending]);

  async function handleResend() {
    if (countdown > 0) return;
    startCountdown();
    const { error } = await sendTwoFactor();
    if (error) {
      toast.error(error);
      resetCountdown();
    }
  }

  async function onSubmit(values: TwoFactor) {
    startTransition(async () => {
      const { error } = await verifyTwoFactor(values);
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
        <CardTitle className="text-xl">Two-factor authentication</CardTitle>
        <CardDescription>
          Enter the verification code sent to your email.
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
