import React from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/db/queries";
import { SettingItem, SettingList } from "./setting";
import { UpdateNameDialog } from "./update-name-dialog";
import { UpdatePasswordDialog } from "./update-password-dialog";
import { ConnectAccountDialog } from "./connect-account-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { TwoFactorAuthenticationDialog } from "./two-factor-authentication-dialog";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/signin");

  return (
    <main className="container py-24">
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-9">
        <SettingList title="Profile">
          <UpdateNameDialog currentName={user.name}>
            <SettingItem
              title="Name"
              description={`Your current display name is ${user.name}`}
            />
          </UpdateNameDialog>
          <SettingItem
            title="Avatar"
            description="Upload or change your profile picture to personalize your account"
          />
        </SettingList>
        <SettingList title="Account">
          <UpdatePasswordDialog hasPassword={user.hasPassword}>
            <SettingItem
              title="Password"
              description={
                user.hasPassword
                  ? "Update your password to keep your account secure"
                  : "Create a secure password to protect your account"
              }
            />
          </UpdatePasswordDialog>
          <TwoFactorAuthenticationDialog
            isTwoFactorEnabled={user.isTwoFactorEnabled}
          >
            <SettingItem
              title="Two-factor authentication"
              description={(() => {
                if (!user.hasPassword) {
                  return "Set up a password in order to enable two-factor authentication";
                }
                return user.isTwoFactorEnabled
                  ? "Remove the extra layer of security from your account"
                  : "Add an extra layer of security to your account";
              })()}
              disabled={!user.hasPassword}
            />
          </TwoFactorAuthenticationDialog>
          <ConnectAccountDialog providers={user.providers}>
            <SettingItem
              title="Connect account"
              description="Connect your social media accounts for easy sign-in"
            />
          </ConnectAccountDialog>
          <DeleteAccountDialog email={user.email}>
            <SettingItem
              title="Delete account"
              description="Permanently remove your account and all associated data"
            />
          </DeleteAccountDialog>
        </SettingList>
      </div>
    </main>
  );
}
