"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { oAuthSignIn, signIn } from "@/lib/auth/actions";
import { signInSchema, SignIn } from "@/lib/auth/definitions";
import { Separator } from "@/components/ui/separator";
import Google from "@/components/icons/google";
import GitHub from "@/components/icons/github";

export function SignInForm(props: React.ComponentProps<typeof Card>) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<SignIn>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignIn) {
    startTransition(async () => {
      const { error } = await signIn(values);
      if (error) toast.error(error);
    });
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex gap-2">
              <Button
                className="flex-1"
                type="button"
                variant="outline"
                onClick={oAuthSignIn.bind(null, "google")}
              >
                <Google className="size-4" />
                Google
              </Button>
              <Button
                className="flex-1"
                type="button"
                variant="outline"
                onClick={oAuthSignIn.bind(null, "github")}
              >
                <GitHub className="size-4" />
                GitHub
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        placeholder="Enter your email address"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <div className="flex items-center">
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Button
                        className="p-0 h-auto ml-auto font-normal"
                        variant="link"
                        asChild
                      >
                        <Link href="/password-reset">
                          Forgot your password?
                        </Link>
                      </Button>
                    </div>
                    <FormControl>
                      <PasswordInput
                        id="password"
                        placeholder="Enter your password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Continue"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <CardDescription>
          Don&apos;t have an account?{" "}
          <Button className="p-0 h-auto font-normal" variant="link" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
