import { NextResponse } from "next/server";
import { Shopify } from "@shopify/shopify-api";

export async function GET(request: Request) {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      request,
      request.url,
      request.url
    );

    return NextResponse.redirect(`/admin/products`);
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 400 }
    );
  }
}
