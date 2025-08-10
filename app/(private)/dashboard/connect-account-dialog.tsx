"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Google from "@/components/icons/google";
import GitHub from "@/components/icons/github";
import { Provider } from "@/lib/auth/oauth";
import { oAuthSignIn } from "@/lib/auth/actions";
import { disconnectProvider } from "./actions";

interface ConnectAccountDialogProps
  extends React.ComponentProps<typeof Dialog> {
  providers: string[];
}

export function ConnectAccountDialog({
  providers,
  children,
  ...props
}: ConnectAccountDialogProps) {
  return (
    <Dialog {...props}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect your account</DialogTitle>
          <DialogDescription>
            Connect your social media accounts to enable additional features and
            easier sign-in options.
          </DialogDescription>
        </DialogHeader>
        <div className="border divide-y rounded-lg">
          <OAuthProvider provider="google" providers={providers}>
            <Google className="size-4" />
            Google
          </OAuthProvider>
          <OAuthProvider provider="github" providers={providers}>
            <GitHub className="size-4 text-foreground" />
            GitHub
          </OAuthProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface OAuthProviderProps extends React.ComponentProps<"label"> {
  provider: Provider;
  providers: string[];
}

function OAuthProvider({ provider, providers, children }: OAuthProviderProps) {
  const [isPending, startTransition] = React.useTransition();
  const isConnected = providers.includes(provider);

  function handleClick() {
    startTransition(async () => {
      if (isConnected) await disconnectProvider(provider);
      else await oAuthSignIn(provider);
    });
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {children}
      </div>
      <Button size="sm" disabled={isPending} onClick={handleClick}>
        {(() => {
          if (isPending) return <Loader2 className="animate-spin" />;
          return isConnected ? "Disconnect" : "Connect";
        })()}
      </Button>
    </div>
  );
}
