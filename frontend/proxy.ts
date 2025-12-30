import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURE_PROTO = "https";

export const config = {
  matcher: "/:path*",
};

export default function proxy(request: NextRequest) {
  const protoHeader = request.headers.get("x-forwarded-proto");

  if (protoHeader && protoHeader !== SECURE_PROTO) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = `${SECURE_PROTO}:`;
    return NextResponse.redirect(secureUrl, 308);
  }

  return NextResponse.next();
}
