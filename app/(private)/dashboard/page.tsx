import React from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { SettingItem, SettingList } from './setting';
import { UpdateNameDialog } from './update-name-dialog';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/signin');

  return (
    <main className="flex flex-col items-center sm:items-start min-h-[calc(100dvh-114px)]">
      <div className="border-dashed border-b w-full">
        <div className="container border-dashed border-x flex flex-col gap-4 py-12">
          <h1 className="text-2xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-4xl lg:leading-[1.1]">
            Dashboard – Private Route
          </h1>
        </div>
      </div>
      <div className="container border-dashed border-x py-12 h-full flex-1">
        <div className="max-w-3xl mx-auto flex flex-col gap-9">
          <SettingList title="Profile">
            <UpdateNameDialog currentName={user.name}>
              <SettingItem title="Name" description={user.name} />
            </UpdateNameDialog>
            <SettingItem
              title="Avatar"
              description="Change your profile photo"
            />
          </SettingList>
          <SettingList title="Security">
            <SettingItem title="Password" description="Change your password" />
            <SettingItem
              title="Two-factor authentication"
              description="Enable two-factor authentication"
            />
            <SettingItem
              title="Delete account"
              description="Permanently delete your account"
            />
          </SettingList>
        </div>
      </div>
    </main>
  );
}
