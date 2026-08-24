import { NextResponse } from "next/server";
import { ROOT_DOMAIN } from "@/lib/constants";
import { fulfillPackage, fulfillQrOrder } from "@/lib/payment/fulfill";
import { getPaymentProvider } from "@/lib/services/payment";

export const runtime = "nodejs";

// İyzico, ödeme bitince buraya token ile POST eder (oturum yok).
// verify() İyzico'ya doğrular → SUCCESS ise fulfill (idempotent) → yönlendir.
export async function POST(req: Request) {
  const base = `https://${ROOT_DOMAIN}`;
  const fail = () => NextResponse.redirect(`${base}/panel?odeme=hata`, 303);

  let token: string | undefined;
  try {
    const form = await req.formData();
    token = form.get("token")?.toString();
  } catch {
    return fail();
  }
  if (!token) return fail();

  try {
    const v = await getPaymentProvider().verify(token);
    if (!v.paid || !v.purpose || !v.refId) return fail();

    if (v.purpose === "qr_order") {
      await fulfillQrOrder(v.refId, token);
      return NextResponse.redirect(`${base}/panel/magaza?odeme=ok`, 303);
    }
    if (v.purpose === "package" && (v.meta === "basic" || v.meta === "premium")) {
      await fulfillPackage(v.refId, v.meta, token);
      return NextResponse.redirect(`${base}/panel/abonelik?odeme=ok`, 303);
    }
  } catch (e) {
    console.error("[payment callback]", e);
  }
  return fail();
}
