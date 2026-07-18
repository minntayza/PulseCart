import { Product, ProductDetails } from '@/types';

const categoryDetails: Record<Product['category'], Omit<ProductDetails, 'overview' | 'specifications' | 'stock'>> = {
  laptops: {
    howItWorks: 'The processor handles everyday instructions while the graphics processor creates demanding visuals. Fast memory keeps several tasks responsive, and the high-refresh display redraws motion more often for smoother games and creative work.',
    bestFor: ['Modern PC gaming', 'Video editing and 3D work', 'Software development', 'People who want desktop-level power in a portable device'],
    limitations: ['Heavier than everyday laptops', 'High performance reduces battery life', 'Cooling fans can become audible under demanding workloads'],
    deliveryEstimate: '2–4 business days', warranty: '1-year manufacturer warranty',
  },
  chairs: {
    howItWorks: 'Adjustable height, tilt, armrests, and lumbar support help keep your spine and shoulders in a more natural position. The goal is to distribute pressure instead of loading one part of your body during long sessions.',
    bestFor: ['Long work or gaming sessions', 'Home offices', 'People who want adjustable posture support', 'Shared desks with different users'],
    limitations: ['Comfort depends on body size and setup', 'Requires assembly', 'Premium ergonomic chairs occupy more floor space'],
    deliveryEstimate: '3–6 business days', warranty: '3-year limited warranty',
  },
  headphones: {
    howItWorks: 'Drivers convert electrical signals into sound. Active noise cancellation listens to surrounding noise and produces an opposing signal, reducing steady sounds such as engines, fans, and office hum.',
    bestFor: ['Music and podcasts', 'Travel and commuting', 'Calls in noisy spaces', 'Focused gaming or office work'],
    limitations: ['Noise cancellation cannot remove every voice or sudden sound', 'Wireless models need charging', 'Fit and comfort vary by head shape'],
    deliveryEstimate: '1–3 business days', warranty: '1-year manufacturer warranty',
  },
  accessories: {
    howItWorks: 'This accessory connects to your computer and improves a specific part of the experience, such as control, typing, display quality, or productivity. Its features are designed to reduce friction in repeated daily tasks.',
    bestFor: ['Upgrading an existing setup', 'Gaming and creative workflows', 'Home-office productivity', 'Users who value more precise controls'],
    limitations: ['Some advanced features require companion software', 'Compatibility should be checked before buying', 'Premium features may be unnecessary for basic use'],
    deliveryEstimate: '1–3 business days', warranty: '1-year limited warranty',
  },
};

export function getProductDetails(product: Product): ProductDetails {
  const shared = categoryDetails[product.category];
  const specifications: ProductDetails['specifications'] = [
    { label: 'Category', value: product.category[0].toUpperCase() + product.category.slice(1) },
    { label: 'Key configuration', value: product.description, explanation: 'The main features provided by the manufacturer for this model.' },
    { label: 'Customer rating', value: `${product.rating} out of 5 from ${product.reviews} reviews`, explanation: 'A summary of customer ratings in the demo catalog.' },
    { label: 'Warranty', value: shared.warranty },
  ];

  // Use database fields when available (AI-generated), fall back to template
  const categoryLabel = { laptops: 'laptop', chairs: 'chair', headphones: 'headphone system', accessories: 'computer accessory' }[product.category];
  const templateOverview = `${product.name} is a ${categoryLabel} designed for people who want ${product.description.toLowerCase()}. It combines practical everyday use with the performance expected from its category.`;

  return {
    howItWorks: product.howItWorks || shared.howItWorks,
    bestFor: product.bestFor?.length ? product.bestFor : shared.bestFor,
    limitations: product.limitations?.length ? product.limitations : shared.limitations,
    overview: product.overview || templateOverview,
    specifications,
    stock: product.stock ?? (8 + Number(product.id) * 2),
    deliveryEstimate: shared.deliveryEstimate,
    warranty: shared.warranty,
  };
}
