import { ResetPasswordForm } from "@/components/account/reset-password-form";

export const dynamic = "force-dynamic";

// Sıfırlama bağlantısı: /sifre-sifirla?token=...
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
