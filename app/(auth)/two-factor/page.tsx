import { redirect } from 'next/navigation';
import { getTwoFactorIdFromCookie } from '@/lib/auth/two-factor';
import { TwoFactorForm } from './form';

export default async function TwoFactorPage() {
  const twoFactorId = await getTwoFactorIdFromCookie();
  if (!twoFactorId) {
    redirect('/signin');
  }

  return (
    <div className="w-full max-w-sm">
      <TwoFactorForm />
    </div>
  );
}
