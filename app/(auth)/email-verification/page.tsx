import { redirect } from 'next/navigation';
import { emailSchema } from '@/lib/auth/definitions';
import { getVerificationEmailFromCookie } from '@/lib/auth/email-verification';
import { EmailVerificationForm } from './form';

export default async function EmailVerificationPage() {
  const email = await getVerificationEmailFromCookie();
  const { success, data } = emailSchema.safeParse(email);
  if (!success) redirect('/signup');

  return (
    <div className="w-full max-w-sm">
      <EmailVerificationForm email={data} />
    </div>
  );
}
