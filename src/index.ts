export { GalvaAdmin } from './client';
export * from './types';

import { GalvaAdmin } from './client';
import { GalvaConfig } from './types';

/**
 * Create a new GalvaAdmin instance
 * @param config - Configuration options
 * @returns GalvaAdmin instance
 * 
 * @example
 * ```typescript
 * import galvaAdmin from 'galva-admin-node';
 * 
 * const galva = galvaAdmin({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.galva.io', // optional
 *   debug: true // optional
 * });
 * 
 * // Track a purchase
 * await galva.trackPurchase({
 *   id: 'event-123',
 *   endUserId: 'user-123',
 *   appIdentifier: 'com.example.app',
 *   productIdentifier: 'premium',
 *   planIdentifier: 'monthly',
 *   platform: 'ios',
 *   eventTimestamp: new Date().toISOString(),
 *   purchasedAt: new Date().toISOString(),
 *   expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
 * });
 * ```
 */
export default function galvaAdmin(config: GalvaConfig): GalvaAdmin {
  return new GalvaAdmin(config);
}