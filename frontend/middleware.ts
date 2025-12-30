import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURE_PROTO = "https";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const protoHeader = request.headers.get("x-forwarded-proto");

  if (protoHeader && protoHeader !== SECURE_PROTO) {
    const secureUrl = new URL(request.url);
    secureUrl.protocol = `${SECURE_PROTO}:`;
    return NextResponse.redirect(secureUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
