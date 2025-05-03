import { redirect } from 'next/navigation';
import { tokenSchema } from '@/lib/auth/definitions';
import { ResetPasswordForm } from './form';
import { prisma } from '@/lib/db/prisma';

type ResetPasswordPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { token } = await params;
  const { success, data } = tokenSchema.safeParse(token);
  if (!success) {
    return <p>The token is invalid</p>;
  }

  const passwordReset = await prisma.passwordReset.findFirst({
    where: {
      token: data,
    },
    select: {
      id: true,
      email: true,
      expiresAt: true,
    },
  });
  if (!passwordReset) {
    return <p>The token is invalid</p>;
  }

  if (passwordReset.expiresAt < new Date()) {
    await prisma.passwordReset.delete({
      where: {
        id: passwordReset.id,
      },
    });
    return <p>The token is expired</p>;
  }

  return (
    <div className="w-full max-w-sm">
      <ResetPasswordForm token={data} />
    </div>
  );
}
