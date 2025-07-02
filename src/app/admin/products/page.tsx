'use client';

import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/shopify');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data.products);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('حدث خطأ أثناء جلب المنتجات');
    }
  };

  const handleUpdate = async (productId: number, bulkQuantity: number, bulkPrice: number) => {
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          bulkQuantity,
          bulkPrice
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? { ...p, metafields: { wholesale: { bulkQuantity, bulkPrice } } } : p
        )
      );
    } catch (error) {
      console.error('Error updating product:', error);
      setError('حدث خطأ أثناء تحديث المنتج');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">إدارة المنتجات</h1>

      {loading && (
        <div className="bg-blue-100 p-4 rounded text-blue-800">
          <p>جاري تحميل المنتجات...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 p-4 rounded text-red-800">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنتج
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السعر الحالي
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية المطلوبة للتخفيض
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  سعر الجملة
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التحديث
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {products.map((product) => (
                <tr key={product.id} className="border-b">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${product.variants[0].price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={product.metafields?.wholesale?.bulkQuantity || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setProducts(prevProducts =>
                          prevProducts.map(p =>
                            p.id === product.id ? { ...p, metafields: { wholesale: { bulkQuantity: value, bulkPrice: p.metafields?.wholesale?.bulkPrice || 0 } } } : p
                          )
                        );
                      }}
                      className="w-24 p-1 border rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      value={product.metafields?.wholesale?.bulkPrice || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setProducts(prevProducts =>
                          prevProducts.map(p =>
                            p.id === product.id ? { ...p, metafields: { wholesale: { bulkQuantity: p.metafields?.wholesale?.bulkQuantity || 0, bulkPrice: value } } } : p
                          )
                        );
                      }}
                      className="w-24 p-1 border rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleUpdate(
                        product.id,
                        product.metafields?.wholesale?.bulkQuantity || 0,
                        product.metafields?.wholesale?.bulkPrice || 0
                      )}
                      className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      تحديث
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
