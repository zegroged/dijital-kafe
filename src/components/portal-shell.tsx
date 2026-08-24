import { SignOutButton } from "@/app/panel/sign-out-button";
import { APP_NAME } from "@/lib/constants";

// Üretici/komisyoncu panelleri için ortak basit kabuk (başlık + çıkış).
export function PortalShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3 md:px-6">
        <span className="font-bold tracking-tight">
          {APP_NAME} <span className="text-muted-foreground">· {label}</span>
        </span>
        <SignOutButton />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
