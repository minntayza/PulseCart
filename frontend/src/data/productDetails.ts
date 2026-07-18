import { Product, ProductDetails, displayCategory } from '@/types';

const categoryDetails: Record<string, Omit<ProductDetails, 'overview' | 'specifications' | 'stock'>> = {
  laptops: {
    howItWorks: 'The processor handles everyday instructions while the graphics processor creates demanding visuals. Fast memory keeps several tasks responsive, and the high-refresh display redraws motion more often for smoother games and creative work.',
    bestFor: ['Modern PC gaming', 'Video editing and 3D work', 'Software development', 'People who want desktop-level power in a portable device'],
    limitations: ['Heavier than everyday laptops', 'High performance reduces battery life', 'Cooling fans can become audible under demanding workloads'],
    warranty: '1-year manufacturer warranty',
  },
  chairs: {
    howItWorks: 'Adjustable height, tilt, armrests, and lumbar support help keep your spine and shoulders in a more natural position. The goal is to distribute pressure instead of loading one part of your body during long sessions.',
    bestFor: ['Long work or gaming sessions', 'Home offices', 'People who want adjustable posture support', 'Shared desks with different users'],
    limitations: ['Comfort depends on body size and setup', 'Requires assembly', 'Premium ergonomic chairs occupy more floor space'],
    warranty: '3-year limited warranty',
  },
  headphones: {
    howItWorks: 'Headphones convert electrical signals into sound waves that you hear directly. They use drivers (small speakers) to produce audio, with options for wired or wireless connections via Bluetooth.',
    bestFor: ['Music listening', 'Gaming audio', 'Video calls and meetings', 'Noise cancellation for focus'],
    limitations: ['Comfort varies by design (over-ear, on-ear, in-ear)', 'Battery life limits wireless use', 'Sound quality varies by price point'],
    warranty: '1-year manufacturer warranty',
  },
  accessories: {
    howItWorks: 'This accessory connects to your computer and improves a specific part of the experience, such as control, typing, display quality, or productivity. Its features are designed to reduce friction in repeated daily tasks.',
    bestFor: ['Upgrading an existing setup', 'Gaming and creative workflows', 'Home-office productivity', 'Users who value more precise controls'],
    limitations: ['Some advanced features require companion software', 'Compatibility should be checked before buying', 'Premium features may be unnecessary for basic use'],
    warranty: '1-year limited warranty',
  },
};

export function getProductDetails(product: Product): ProductDetails {
  const shared = categoryDetails[product.category];
  const specifications: ProductDetails['specifications'] = [
    { label: 'Category', value: displayCategory(product.category) },
    { label: 'Key configuration', value: product.description, explanation: 'The main features provided by the manufacturer for this model.' },
    { label: 'Customer rating', value: `${product.rating} out of 5 from ${product.reviews} reviews`, explanation: 'A summary of customer ratings in the demo catalog.' },
    { label: 'Warranty', value: shared.warranty },
  ];

  // Use database fields when available (AI-generated), fall back to template
  const categoryLabel = { laptops: 'laptop', chairs: 'chair', headphones: 'headphone', accessories: 'computer accessory' }[product.category];
  const templateOverview = `${product.name} is a ${categoryLabel} designed for people who want ${product.description.toLowerCase()}. It combines practical everyday use with the performance expected from its category.`;

  return {
    howItWorks: product.howItWorks || shared.howItWorks,
    bestFor: product.bestFor?.length ? product.bestFor : shared.bestFor,
    limitations: product.limitations?.length ? product.limitations : shared.limitations,
    overview: product.overview || templateOverview,
    specifications,
    stock: product.stock ?? 10,
    warranty: shared.warranty,
  };
}
