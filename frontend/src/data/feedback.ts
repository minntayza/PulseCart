import { FeedbackMessage, FeedbackTheme } from '@/types';

export const feedbackMessages: FeedbackMessage[] = [
  { id: '1', userId: 'user_142', message: 'I ordered 5 days ago and still no tracking info. When will my order arrive?', theme: 'delivery', createdAt: '2h ago' },
  { id: '2', userId: 'user_138', message: 'Found the same chair cheaper on another site. Can you price match?', theme: 'pricing', createdAt: '3h ago' },
  { id: '3', userId: 'user_135', message: 'No delivery updates after order was placed. Very frustrating.', theme: 'delivery', createdAt: '4h ago' },
  { id: '4', userId: 'user_129', message: 'Headphones feel slightly different from the listing photos.', theme: 'quality', createdAt: '5h ago' },
  { id: '5', userId: 'user_127', message: 'Still waiting for my order. No ETA provided at checkout.', theme: 'delivery', createdAt: '6h ago' },
  { id: '6', userId: 'user_124', message: 'The keyboard I received has a different color than what I ordered.', theme: 'quality', createdAt: '7h ago' },
  { id: '7', userId: 'user_121', message: 'Shipping cost seems high compared to other stores.', theme: 'pricing', createdAt: '8h ago' },
  { id: '8', userId: 'user_118', message: 'Order arrived damaged. Box was crushed.', theme: 'quality', createdAt: '9h ago' },
  { id: '9', userId: 'user_115', message: 'No way to track my package after it shipped.', theme: 'delivery', createdAt: '10h ago' },
  { id: '10', userId: 'user_112', message: 'Would be nice to have delivery time estimates before ordering.', theme: 'delivery', createdAt: '11h ago' },
];

export const feedbackThemes: FeedbackTheme[] = [
  {
    theme: 'Delivery Visibility',
    icon: '📦',
    count: 12,
    severity: 'high',
    suggestedFix: 'Add proactive ETA messages at checkout and post-purchase tracking updates',
  },
  {
    theme: 'Pricing Concerns',
    icon: '💰',
    count: 8,
    severity: 'medium',
    suggestedFix: 'Add price-match guarantee badge on product pages',
  },
  {
    theme: 'Product Quality',
    icon: '🏷️',
    count: 7,
    severity: 'low',
    suggestedFix: 'Add quality guarantee section to product descriptions',
  },
];
