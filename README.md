# Galva Admin Node SDK

Node.js SDK for syncing billing events and managing end users with Galva.

## Installation

```bash
npm install galva-admin-node
```

**Peer dependencies** (install as needed):
```bash
npm install @paddle/paddle-node-sdk  # For Paddle
npm install googleapis               # For Play Store
```

## Quick Start

```typescript
import { Galva } from 'galva-admin-node';

const galva = new Galva({ apiKey: 'your-api-key' });
// Or set GALVA_API_KEY environment variable
```

## Billing Events

### With Pre-verified Payloads

Use when you've already decoded/verified payloads yourself.

```typescript
// App Store
await galva.billingEvent.appstore('user-123', {
  signedPayload: '...',
  bundleId: 'com.example.app',
  appAppleId: 123456789,
});

// Play Store (decoded notification)
await galva.billingEvent.playstore('user-123', decodedNotification);

// Paddle (verified event)
await galva.billingEvent.paddle('user-123', verifiedEvent);
```

### With Credentials (Auto-verification)

Use `withCredentials()` to let the SDK handle decoding and verification.

```typescript
const galvaWithCreds = galva.withCredentials({
  appstore: {
    bundleId: 'com.example.app',
    appAppleId: 123456789,
  },
  playstore: {
    email: 'service-account@project.iam.gserviceaccount.com',
    key: '-----BEGIN PRIVATE KEY-----\n...',
  },
  paddle: {
    apiKey: 'pdl_...',
    secretKey: 'whsec_...',
  },
});

// App Store (signed payload only)
await galvaWithCreds.billingEvent.appstore('user-123', signedPayload);

// Play Store (base64 from Pub/Sub - auto-decodes and fetches subscription)
await galvaWithCreds.billingEvent.playstore('user-123', base64Payload);

// Paddle (raw body + signature - auto-verifies)
await galvaWithCreds.billingEvent.paddle('user-123', rawBody, signature);
```

## End User Management

```typescript
import { EndUserDefaultTraitName } from 'galva-admin-node';

// Identify with traits
await galva.endUser.identify('user-123', {
  traits: {
    [EndUserDefaultTraitName.EMAIL]: 'user@example.com',
    [EndUserDefaultTraitName.FULL_NAME]: 'John Doe',
    customTrait: 'value',
  },
});

// Update default profile info
await galva.endUser.updateDefaultInfo('user-123', {
  email: 'user@example.com',
  fullName: 'John Doe',
  country: 'US',
});
```

## Configuration

```typescript
interface GalvaOptions {
  apiKey?: string;                          // Falls back to GALVA_API_KEY env
  environment?: 'production' | 'development'; // Falls back to NODE_ENV
  timeout?: number;                         // Request timeout in ms (default: 10000)
}
```

## Error Handling

```typescript
import { GalvaError } from 'galva-admin-node';

try {
  await galva.billingEvent.appstore('user-123', payload);
} catch (error) {
  if (error instanceof GalvaError) {
    console.error(error.code, error.message);
  }
}
```

## Requirements

- Node.js >= 18.0

## License

MIT
