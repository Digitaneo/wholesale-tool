import { NextResponse } from "next/server";
import { Shopify } from "@shopify/shopify-api";

export async function GET() {
  try {
    const session = await Shopify.Utils.loadCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'No active session found' }, { status: 401 });
    }

    const client = new Shopify.GraphQL({
      accessToken: session.accessToken,
      shopOrigin: session.shop,
      apiVersion: Shopify.Context.API_VERSION
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

    return NextResponse.json({ products: response.data.products });
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { productId, bulkQuantity, bulkPrice } = await request.json();

    const session = await Shopify.Utils.loadCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'No active session found' }, { status: 401 });
    }

    const client = new Shopify.GraphQL({
      accessToken: session.accessToken,
      shopOrigin: session.shop,
      apiVersion: Shopify.Context.API_VERSION
    });

    // أولاً، نتحقق من وجود المنتج
    const productQuery = `{
      product(id: "gid://shopify/Product/${productId}") {
        id
        variants(first: 10) {
          edges {
            node {
              id
              price
            }
          }
        }
      }
    }`;

    const productResponse = await client.query(productQuery);

    if (!productResponse.data.product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // إنشاء أو تحديث الميتافيلد للجملة
    const mutation = `mutation {
      metafieldCreate(input: {
        namespace: "wholesale",
        key: "bulk",
        value: "{\"bulkQuantity\": ${bulkQuantity}, \"bulkPrice\": ${bulkPrice}}",
        type: JSON,
        owner: ${productResponse.data.product.id}
      }) {
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

    const mutationResponse = await client.query(mutation);

    if (mutationResponse.data.metafieldCreate.userErrors.length > 0) {
      return NextResponse.json({
        error: mutationResponse.data.metafieldCreate.userErrors[0].message
      }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
