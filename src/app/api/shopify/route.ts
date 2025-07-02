import { NextResponse } from "next/server";
import { Shopify, ApiVersion } from "@shopify/shopify-api";

// Initialize Shopify context
Shopify.Context.initialize({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ['read_products', 'read_customers', 'write_customers', 'read_orders', 'write_orders'],
  hostName: process.env.HOST.replace(/https:\/\//, ''),
  apiVersion: ApiVersion.July22,
  isEmbeddedApp: true,
  enableApiRateLimitProtection: true
});

export async function GET(request: Request) {
  try {
    const session = await Shopify.Utils.loadCurrentSession(request);
    if (!session) {
      return NextResponse.json({ error: 'No active session found' }, { status: 401 });
    }

    const client = new Shopify.GraphQL.Client({
      accessToken: session.accessToken,
      shopOrigin: session.shop,
      apiVersion: ApiVersion.July22
    });

    const query = `{
      products(first: 10) {
        edges {
          node {
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
          }
        }
      }
    }`;

    const response = await client.query(query);
    const data = await response.json();

    return NextResponse.json({ products: data.data.products });
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await Shopify.Utils.loadCurrentSession(request);
    if (!session) {
      return NextResponse.json({ error: 'No active session found' }, { status: 401 });
    }

    const { productId, bulkQuantity, bulkPrice } = await request.json();

    const client = new Shopify.GraphQL.Client({
      accessToken: session.accessToken,
      shopOrigin: session.shop,
      apiVersion: ApiVersion.July22
    });

    const query = `mutation updateMetafield($input: MetafieldInput!) {
      metafieldCreate(input: $input) {
        metafield {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }`;

    const variables = {
      input: {
        namespace: "wholesale",
        key: "pricing",
        value: JSON.stringify({ bulkQuantity, bulkPrice }),
        ownerResource: "Product",
        ownerId: productId
      }
    };

    const response = await client.query(query, variables);
    const data = await response.json();

    if (data.data.metafieldCreate.userErrors.length > 0) {
      return NextResponse.json({ error: data.data.metafieldCreate.userErrors[0].message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ error: 'Failed to update metafield' }, { status: 500 });
  }
}
