import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale Tool - إدارة البيع بالجملة",
  description: "تطبيق لإدارة البيع بالجملة في Shopify",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Wholesale Tool</h1>
      <p className="mt-4">إدارة البيع بالجملة في متجر Shopify</p>
    </main>
  );
}
