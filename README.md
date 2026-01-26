# Galva Admin Node SDK

TypeScript SDK for integrating with Galva Admin API. This SDK provides a type-safe way to sync billing events and manage user data.

## Installation

```bash
npm install galva-admin-node
```

## Quick Start

```typescript
import galvaAdmin from 'galva-admin-node';

const galva = galvaAdmin({
  apiKey: 'your-api-key-here',
  baseUrl: 'https://api.galva.io', // optional
  debug: true // optional, enables logging
});
```

## Usage Examples

### Track a Purchase

```typescript
await galva.trackPurchase({
  id: 'evt_123',
  endUserId: 'user_456',
  appIdentifier: 'com.example.app',
  productIdentifier: 'premium_monthly',
  planIdentifier: 'monthly',
  platform: 'ios',
  eventTimestamp: new Date().toISOString(),
  purchasedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isTrial: false
});
```

### Track a Renewal

```typescript
await galva.trackRenewal({
  id: 'evt_124',
  endUserId: 'user_456',
  appIdentifier: 'com.example.app',
  productIdentifier: 'premium_monthly',
  planIdentifier: 'monthly',
  platform: 'ios',
  eventTimestamp: new Date().toISOString(),
  purchasedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
});
```

### Track a Cancellation

```typescript
await galva.trackCancellation({
  id: 'evt_125',
  endUserId: 'user_456',
  appIdentifier: 'com.example.app',
  productIdentifier: 'premium_monthly',
  planIdentifier: 'monthly',
  platform: 'ios',
  eventTimestamp: new Date().toISOString(),
  cancelReason: 'too_expensive',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
});
```

### Identify a User

```typescript
await galva.identify({
  userId: 'user_456',
  email: 'user@example.com',
  name: 'John Doe',
  attributes: {
    plan: 'premium',
    signupDate: '2024-01-01',
    referralSource: 'organic'
  }
});
```

### Sync Multiple Events (Batch)

```typescript
const events = [
  {
    id: 'evt_126',
    type: 'initial-purchase' as const,
    endUserId: 'user_789',
    appIdentifier: 'com.example.app',
    productIdentifier: 'premium_yearly',
    planIdentifier: 'yearly',
    platform: 'android' as const,
    eventTimestamp: new Date().toISOString(),
    purchasedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  // ... more events
];

await galva.syncEvents(events);
```

### Queue Events for Batch Processing

```typescript
// Queue events (they'll be automatically batched)
galva.queueEvent({
  id: 'evt_127',
  type: 'renewal',
  endUserId: 'user_123',
  appIdentifier: 'com.example.app',
  productIdentifier: 'premium_monthly',
  planIdentifier: 'monthly',
  platform: 'stripe',
  eventTimestamp: new Date().toISOString(),
  purchasedAt: new Date().toISOString()
}, {
  maxBatchSize: 50,    // Flush after 50 events
  flushInterval: 10000 // Flush every 10 seconds
});

// Manually flush queued events
await galva.flush();
```

## API Reference

### Configuration

```typescript
interface GalvaConfig {
  apiKey: string;       // Required: Your API key
  baseUrl?: string;     // Optional: API base URL (default: https://api.galva.io)
  timeout?: number;     // Optional: Request timeout in ms (default: 30000)
  debug?: boolean;      // Optional: Enable debug logging (default: false)
}
```

### Methods

#### Event Tracking

- `trackPurchase(event)` - Track an initial purchase event
- `trackRenewal(event)` - Track a subscription renewal
- `trackCancellation(event)` - Track a subscription cancellation
- `trackBillingIssue(event)` - Track a billing issue
- `trackExpiration(event)` - Track a subscription expiration
- `trackUpgrade(event)` - Track a plan upgrade
- `trackRefund(event)` - Track a refund

#### Generic Event Methods

- `syncEvent(event)` - Sync a single billing event
- `syncEvents(events)` - Batch sync multiple events
- `queueEvent(event, options?)` - Queue an event for batch processing
- `flush()` - Manually flush the event queue

#### User Management

- `identify(userData)` - Identify a user and sync their attributes
- `getUserStatus(userId)` - Get a user's subscription status

#### Utility

- `healthCheck()` - Check API health status

### Event Types

The SDK supports the following billing event types:

- `initial-purchase` - New subscription or trial
- `renewal` - Subscription renewal
- `cancellation` - Subscription cancellation
- `billing-issue` - Payment failure or issue
- `expiration` - Subscription expiration
- `upgraded` - Plan upgrade
- `refund` - Refund processed
- `resubscribe` - User resubscribed
- `transfer` - Subscription transferred between users
- `grace_period_start` - Grace period started

### Error Handling

```typescript
import { GalvaError } from 'galva-admin-node';

try {
  await galva.trackPurchase(eventData);
} catch (error) {
  if (error instanceof GalvaError) {
    console.error('Galva API Error:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details
    });
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Requirements

- Node.js 18.0 or higher (for native fetch support)
- TypeScript 5.0 or higher (for development)

## License

MIT