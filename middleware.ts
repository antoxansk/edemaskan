import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Capture UTM params from landing page into cookie (30 days)
  const { searchParams } = request.nextUrl;
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  const utmValues: Record<string, string> = {};

  for (const key of utmKeys) {
    const value = searchParams.get(key);
    if (value) utmValues[key] = value;
  }

  if (Object.keys(utmValues).length > 0) {
    response.cookies.set("edm_utm", JSON.stringify(utmValues), {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
