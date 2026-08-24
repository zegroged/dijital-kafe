import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

// Kayıt/giriş için ortalanmış, sade kabuk.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-2xl font-bold tracking-tight">
        {APP_NAME}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
