import { prisma } from '@/lib/db/prisma';
import { tokenSchema } from '@/lib/auth/definitions';
import { isExpired } from '@/lib/security/time';
import { ResetPasswordForm } from './form';

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

  if (isExpired(passwordReset.expiresAt)) {
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
