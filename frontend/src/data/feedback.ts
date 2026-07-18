import { FeedbackMessage, FeedbackTheme } from '@/types';

export const feedbackMessages: FeedbackMessage[] = [
  { id: '1', userId: 'user_142', message: 'I ordered 5 days ago and still no tracking info. When will my order arrive?', theme: 'delivery', severity: 'high', createdAt: '2026-07-18T10:00:00Z' },
  { id: '2', userId: 'user_138', message: 'Found the same chair cheaper on another site. Can you price match?', theme: 'pricing', severity: 'medium', createdAt: '2026-07-18T09:00:00Z' },
  { id: '3', userId: 'user_135', message: 'No delivery updates after order was placed. Very frustrating.', theme: 'delivery', severity: 'high', createdAt: '2026-07-18T08:00:00Z' },
  { id: '4', userId: 'user_129', message: 'Headphones feel slightly different from the listing photos.', theme: 'quality', severity: 'low', createdAt: '2026-07-18T07:00:00Z' },
  { id: '5', userId: 'user_127', message: 'Still waiting for my order. No ETA provided at checkout.', theme: 'delivery', severity: 'high', createdAt: '2026-07-18T06:00:00Z' },
  { id: '6', userId: 'user_124', message: 'The keyboard I received has a different color than what I ordered.', theme: 'quality', severity: 'medium', createdAt: '2026-07-18T05:00:00Z' },
  { id: '7', userId: 'user_121', message: 'Shipping cost seems high compared to other stores.', theme: 'pricing', severity: 'low', createdAt: '2026-07-18T04:00:00Z' },
  { id: '8', userId: 'user_118', message: 'Order arrived damaged. Box was crushed.', theme: 'quality', severity: 'high', createdAt: '2026-07-18T03:00:00Z' },
  { id: '9', userId: 'user_115', message: 'No way to track my package after it shipped.', theme: 'delivery', severity: 'medium', createdAt: '2026-07-18T02:00:00Z' },
  { id: '10', userId: 'user_112', message: 'Would be nice to have delivery time estimates before ordering.', theme: 'delivery', severity: 'low', createdAt: '2026-07-18T01:00:00Z' },
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
