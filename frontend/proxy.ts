import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURE_PROTO = "https";
const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function middleware(request: NextRequest) {
  const protoHeader = request.headers.get("x-forwarded-proto");

  if (protoHeader && protoHeader !== SECURE_PROTO) {
    const secureUrl = new URL(request.url);
    secureUrl.protocol = `${SECURE_PROTO}:`;
    return NextResponse.redirect(secureUrl, 308);
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") ?? "*";

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Vary": "Origin",
          ...CORS_HEADERS,
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
