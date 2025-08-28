"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword } from "@/lib/auth/actions";
import { passwordResetSchema, PasswordReset } from "@/lib/auth/definitions";

interface ResetPasswordFormProps extends React.ComponentProps<typeof Card> {
  token: string;
}

export function ResetPasswordForm({ token, ...props }: ResetPasswordFormProps) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<PasswordReset>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      token,
    },
  });

  async function onSubmit(values: PasswordReset) {
    startTransition(async () => {
      const { error } = await resetPassword(values);
      if (error) toast.error(error);
    });
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Set your new password</CardTitle>
        <CardDescription>
          Enter a new password below to change your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-2">
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
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
