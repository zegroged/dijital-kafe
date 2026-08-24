import { NextResponse, type NextRequest } from "next/server";
import { ROOT_DOMAIN } from "@/lib/constants";

// Kök domain (port hariç). Local: localhost | Prod: to-p1.com
const rootHost = ROOT_DOMAIN.split(":")[0];

// SADECE subdomain çözümlemesi yapar. DB sorgusu YOK (edge limiti riski).
// Menü verisi /menu/[slug] sayfasında (Node runtime) çekilir.
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // apex veya www → landing / dashboard (olduğu gibi geç)
  if (!host || host === rootHost || host === `www.${rootHost}`) {
    return NextResponse.next();
  }

  // <slug>.to-p1.com → menü sitesi
  if (host.endsWith(`.${rootHost}`)) {
    const subdomain = host.slice(0, host.length - rootHost.length - 1);
    // tek seviye, boş olmayan subdomain
    if (subdomain && !subdomain.includes(".")) {
      const url = req.nextUrl.clone();
      const rest = url.pathname === "/" ? "" : url.pathname;
      url.pathname = `/menu/${subdomain}${rest}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

// api, next dahili yolları, statik dosyalar (uzantılı) hariç her şeyi yakala.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
