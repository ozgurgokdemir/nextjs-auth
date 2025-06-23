'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTwoFactor } from '@/components/two-factor-provider';
import { disableTwoFactor, enableTwoFactor } from './actions';

interface TwoFactorAuthenticationDialogProps
  extends React.ComponentProps<typeof Dialog> {
  isTwoFactorEnabled: boolean;
}

export function TwoFactorAuthenticationDialog({
  isTwoFactorEnabled,
  children,
  ...props
}: TwoFactorAuthenticationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const { startVerification } = useTwoFactor();

  async function handleTwoFactor() {
    startTransition(async () => {
      if (isTwoFactorEnabled) {
        const { status, message, requires2FA } = await disableTwoFactor();
        if (requires2FA) {
          startVerification(async () => {
            startTransition(async () => {
              const { status, message } = await disableTwoFactor();
              if (status === 'error') {
                toast.error(message);
              }
              if (status === 'success') {
                setOpen(false);
                toast.success(message);
              }
            });
          });
        }
        if (status === 'error') {
          toast.error(message);
        }
        if (status === 'success') {
          setOpen(false);
          toast.success(message);
        }
      } else {
        const { status, message } = await enableTwoFactor();
        if (status === 'error') {
          toast.error(message);
        }
        if (status === 'success') {
          setOpen(false);
          toast.success(message);
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} {...props}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {`${
              isTwoFactorEnabled ? 'Disable' : 'Enable'
            } two-factor authentication`}
          </DialogTitle>
          <DialogDescription>
            {`Two-factor authentication adds an extra layer of security to your
            account by requiring a verification code when you sign in. ${
              isTwoFactorEnabled
                ? 'Are you sure you want to disable it?'
                : 'Would you like to enable it?'
            }`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={handleTwoFactor}
          >
            {(() => {
              if (isPending) return <Loader2 className="animate-spin" />;
              return isTwoFactorEnabled ? 'Disable' : 'Enable';
            })()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
