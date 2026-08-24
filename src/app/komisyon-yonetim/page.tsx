import { ChangePassword } from "@/components/account/change-password";
import { CreateAffiliate } from "@/components/admin/admin-forms";
import { PortalShell } from "@/components/portal-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAffiliateManager } from "@/lib/auth/session";
import { COMMISSION_TYPE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AffiliateManagerPage() {
  await requireAffiliateManager();

  const affiliates = await prisma.affiliate.findMany({
    include: {
      user: { select: { email: true, phone: true, name: true } },
      _count: { select: { referrals: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalShell label="Komisyon Yönetimi">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Komisyon Yönetimi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Komisyoncu hesabı aç ve referans kodu ver. Kazanç tipini seçmeyi
            unutma.
          </p>
        </div>

        <CreateAffiliate />

        <Card>
          <CardHeader>
            <CardTitle>Komisyoncular ({affiliates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {affiliates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz komisyoncu yok. İlk hesabı oluştur.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-1.5 font-medium">Telefon</th>
                      <th className="py-1.5 font-medium">Kod</th>
                      <th className="py-1.5 font-medium">Tip</th>
                      <th className="py-1.5 font-medium">Referans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="py-2">
                          {a.user.email ?? a.user.phone ?? "—"}
                        </td>
                        <td className="py-2">
                          <code className="rounded bg-muted px-1.5 py-0.5">
                            {a.code}
                          </code>
                        </td>
                        <td className="py-2">
                          {COMMISSION_TYPE_LABELS[a.commissionType]}
                        </td>
                        <td className="py-2">{a._count.referrals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <ChangePassword />
      </div>
    </PortalShell>
  );
}
