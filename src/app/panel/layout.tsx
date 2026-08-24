import Link from "next/link";
import { PanelNav } from "@/components/panel/nav";
import { requireOwnerRole, requireRestaurant } from "@/lib/auth/session";
import { APP_NAME, ROOT_DOMAIN } from "@/lib/constants";
import { SignOutButton } from "./sign-out-button";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOwnerRole();
  const restaurant = await requireRestaurant(user.id);
  const menuUrl = `${restaurant.slug}.${ROOT_DOMAIN}`;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6">
        <Link href="/panel" className="font-bold tracking-tight">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {menuUrl}
          </span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="border-b p-3 md:w-52 md:shrink-0 md:border-r md:border-b-0 md:p-4">
          <PanelNav />
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
