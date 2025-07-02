'use client';

import { useState, useEffect } from "react";

interface ProductVariant {
  id: string;
  price: string;
  node: {
    price: string;
  };
}

interface Metafield {
  id: string;
  namespace: string;
  key: string;
  value: {
    bulkQuantity: number;
    bulkPrice: number;
  };
  node: {
    value: {
      bulkQuantity: number;
      bulkPrice: number;
    };
  };
}

interface Product {
  id: string;
  title: string;
  variants: {
    edges: Array<{
      node: {
        id: string;
        price: string;
      };
    }>;
  };
  metafields: {
    edges: Array<{
      node: {
        id: string;
        namespace: string;
        key: string;
        value: string;
      };
    }>;
  };
}

interface MetafieldValue {
  bulkQuantity: number;
  bulkPrice: number;
}

interface ShopifyResponse {
  products: {
    edges: Array<{
      node: Product;
    }>;
  };
}

export default function TestPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/shopify');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data: ShopifyResponse = await response.json();
      setProducts(data.products.edges.map((edge: { node: Product }) => edge.node));
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('حدث خطأ أثناء جلب المنتجات');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(0);
    setFinalPrice(0);
  };

  const calculateFinalPrice = () => {
    if (!selectedProduct || quantity <= 0) return;

    const regularPrice = parseFloat(selectedProduct.variants.edges[0].node.price);
    const metafieldValue = JSON.parse(selectedProduct.metafields.edges[0].node.value) as MetafieldValue;
    const bulkQuantity = metafieldValue.bulkQuantity || 0;
    const bulkPrice = metafieldValue.bulkPrice || 0;

    let finalPrice = regularPrice;
    
    if (quantity >= bulkQuantity) {
      finalPrice = bulkPrice;
    }

    setFinalPrice(finalPrice);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">اختبار حساب سعر الجملة</h1>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اختر المنتج
        </label>
        <select
          value={selectedProduct?.id || ''}
          onChange={(e) => handleProductSelect(products.find(p => p.id === e.target.value) as Product)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">اختر المنتج...</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.title}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الكمية المطلوبة
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                setQuantity(value);
                calculateFinalPrice();
              }
            }}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      )}

      {finalPrice > 0 && (
        <div className="text-xl font-bold">
          السعر النهائي: {finalPrice} DZD
        </div>
      )}
    </div>
  );
}
