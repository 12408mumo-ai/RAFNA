// Typed bridge for the preserved storefront; the deployed bundle owns the UI.
export type Product = { id: string; title: string; category: string; price: number; description: string; image_url: string; created_at: string };
export async function getProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('The products could not be loaded. Please try again.');
  return response.json();
}
