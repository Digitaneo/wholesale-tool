import { Shopify } from "@shopify/shopify-api";

if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !process.env.HOST) {
  throw new Error('Missing required environment variables');
}

Shopify.Context.initialize({
  API: {
    KEY: process.env.SHOPIFY_API_KEY,
    SECRET: process.env.SHOPIFY_API_SECRET,
  },
  SCOPES: [
    "read_products",
    "write_products",
    "read_customers",
    "write_customers",
    "read_orders",
    "write_orders"
  ],
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: "2023-07",
  IS_EMBEDDED_APP: true,
  ENABLE_API_RATE_LIMIT_PROTECTION: true,
  IS_PRIVATE_APP: false,
  IS_EMBEDDED: true
});

export const shopify = Shopify;
