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
    const session = await Shopify.Utils.loadCurrentSession();
    if (!session) {
      throw new Error('No active session found');
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
    const client = new Shopify.GraphQL.Client({
      accessToken: session.accessToken,
      shopOrigin: session.shop,
      apiVersion: ApiVersion.July22
    });

    const query = `{
      product(id: "gid://shopify/Product/${productId}") {
        id
        title
        variants(first: 10) {
          edges {
            node {
              id
              price
              metafields(first: 10) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                  }
                }
              }
            }
          }
        }
        metafields(namespace: "wholesale") {
          key
          value
        }
      }
    }`;

    const response = await client.query(query);
    const data = await response.json();
    return data.data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function updateProduct(productId: number, updates: any) {
  try {
    const session = await getShopifySession();
    const client = new Shopify.GraphQL.Client({
      accessToken: session.accessToken,
      shopOrigin: session.shop,
      apiVersion: ApiVersion.July22
    });

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
