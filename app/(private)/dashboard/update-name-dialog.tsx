'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { nameSchema } from '@/lib/auth/definitions';
import { updateUserName } from './actions';

const updateNameSchema = z.object({
  name: nameSchema,
});
type UpdateName = z.infer<typeof updateNameSchema>;

interface UpdateNameDialogProps extends React.ComponentProps<typeof Dialog> {
  currentName: string;
}

export function UpdateNameDialog({
  currentName,
  children,
  ...props
}: UpdateNameDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<UpdateName>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: {
      name: currentName,
    },
  });

  async function onSubmit({ name }: UpdateName) {
    startTransition(async () => {
      const { status, message } = await updateUserName(name);
      if (status === 'error') form.setError('name', { message });
      if (status === 'success') setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} {...props}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update your name</DialogTitle>
          <DialogDescription>
            This will update the name displayed on your profile. Please enter
            your new name below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      id="name"
                      placeholder="Enter your new name"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            className="w-full"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending ? <Loader2 className="animate-spin" /> : 'Update name'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
