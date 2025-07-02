import { Shopify, ApiVersion } from "@shopify/shopify-api";

if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !process.env.HOST || !process.env.SHOPIFY_SHOP || !process.env.SHOPIFY_PASSWORD) {
  throw new Error('Missing required environment variables');
}

Shopify.Context.initialize({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: [
    "read_products",
    "write_products",
    "read_customers",
    "write_customers",
    "read_orders",
    "write_orders"
  ],
  hostName: process.env.HOST.replace(/https:\/\//, ""),
  apiVersion: ApiVersion.July22,
  isEmbeddedApp: true,
  enableApiRateLimitProtection: true,
  isPrivateApp: false,
  isEmbedded: true,
  shop: process.env.SHOPIFY_SHOP,
  password: process.env.SHOPIFY_PASSWORD
});

export const shopify = Shopify;

export async function getShopifySession() {
  try {
    // التحقق من وجود متغيرات البيئة
    if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !process.env.HOST) {
      throw new Error('Missing required environment variables');
    }

    // تهيئة الجلسة
    const session = await Shopify.Utils.loadCurrentSession();
    if (!session) {
      throw new Error('No active session found');
    }

    // التحقق من صحة الجلسة
    if (!session.shop || !session.accessToken) {
      throw new Error('Invalid session data');
    }

    return session;
  } catch (error) {
    console.error('Error getting Shopify session:', error);
    throw error;
  }
}

export async function getProduct(productId: number) {
  try {
    const session = await getShopifySession();
    const client = new shopify.Clients.Graphql(session.shop, session.accessToken);
    
    // جلب المنتج مع معلومات التخفيض
    const query = `{
      product(id: "gid://shopify/Product/${productId}") {
        id
        title
        variants(first: 1) {
          edges {
            node {
              id
              price
            }
          }
        }
        metafields(namespace: "wholesale") {
          key
          value
        }
      }
    }`;

    const response = await client.query({
      data: query
    });

    return response.body.data.product;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
}

export async function updateProduct(productId: number, updates: any) {
  try {
    const session = await getShopifySession();
    const client = new shopify.Clients.Graphql(session.shop, session.accessToken);

    // تحديث المنتج مع الحفاظ على البيانات القديمة
    const query = `mutation {
      productUpdate(input: {
        id: "gid://shopify/Product/${productId}"
        metafields: {
          wholesale: {
            bulkQuantity: ${updates.metafields?.wholesale?.bulkQuantity}
            bulkPrice: "${updates.metafields?.wholesale?.bulkPrice}"
          }
        }
      }) {
        product {
          id
          title
          metafields(namespace: "wholesale") {
            key
            value
          }
        }
        userErrors {
          message
        }
      }
    }`;

    const response = await client.query({
      data: query
    });

    if (response.body.data.productUpdate.userErrors.length > 0) {
      throw new Error(response.body.data.productUpdate.userErrors[0].message);
    }

    return response.body.data.productUpdate.product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}
