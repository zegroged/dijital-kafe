import { SignOutButton } from "@/app/panel/sign-out-button";
import { requireAdmin } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3 md:px-6">
        <span className="font-bold tracking-tight">
          {APP_NAME} <span className="text-muted-foreground">· Admin</span>
        </span>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
