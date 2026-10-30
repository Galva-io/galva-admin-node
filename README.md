# Galva Admin Node SDK

Node.js SDK for syncing billing events and managing end users with Galva.

## Installation

```bash
npm install @galva-io/galva-admin-node
```

## Quick Start

```typescript
import { Galva } from '@galva-io/galva-admin-node';

const galva = new Galva({ apiKey: 'your-api-key' });
// Or set GALVA_API_KEY

// Use the sandbox environment for development
const sandboxGalva = new Galva({
  apiKey: 'your-api-key',
  environment: 'sandbox',
});
```

## Billing Events

### Webhook Forwarding

The SDK forwards billing events through the API-key-authenticated webhook
ingress. The API key resolves the app integration and `endUserId` is used for
identity resolution when supplied.

| Provider | Method signature |
|---|---|
| App Store | `appstore(signedPayload, endUserId?)` |
| Google Play | `playstore(base64Payload, endUserId?)` |
| Paddle | `paddle(rawBody, signature, endUserId?)` |

```typescript
// App Store Server Notification signedPayload
await galva.billingEvent.appstore(signedPayload, 'user-123');

// Google Play: message.data from the Pub/Sub push envelope
await galva.billingEvent.playstore(base64Payload, 'user-123');

// Raw Paddle request body and Paddle-Signature header
await galva.billingEvent.paddle(rawBody, signature, 'user-123');

// endUserId is optional for all three methods
await galva.billingEvent.appstore(signedPayload);
await galva.billingEvent.playstore(base64Payload);
await galva.billingEvent.paddle(rawBody, signature);
```

The SDK sends `x-api-key` on every request. Billing requests use the ingress
host and have these bodies:

| SDK method | HTTP endpoint | JSON body |
|---|---|---|
| `billingEvent.appstore` | `POST /appstore` | `{ signedPayload, endUserId? }` |
| `billingEvent.playstore` | `POST /playstore` | `{ message: { data: base64Payload }, endUserId? }` |
| `billingEvent.paddle` | `POST /paddle` | `{ rawBody, signature, endUserId? }` |

The ingress resolves the tenant and app from the API key. For Google Play,
`base64Payload` must decode to a valid Real-time Developer Notification JSON;
the backend enriches subscription details after ingestion. For Paddle, ingress
uses the app's configured signing secret to verify the exact raw body against
the `Paddle-Signature` header from the original Paddle request. The signature is
webhook input, not a Paddle credential configured in the SDK.

Do not parse and re-serialize the Paddle body before forwarding it, because the
signature is calculated from the exact raw bytes:

```typescript
app.post(
  '/webhooks/paddle',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const rawBody = request.body.toString('utf8');
    const signature = request.header('Paddle-Signature');

    if (!signature) {
      response.sendStatus(400);
      return;
    }

    await galva.billingEvent.paddle(rawBody, signature, endUserId);
    response.sendStatus(200);
  },
);
```

## End User Management

```typescript
import { EndUserDefaultTraitName } from '@galva-io/galva-admin-node';

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
  environment?: 'production' | 'sandbox';   // Defaults to production
  timeout?: number;                         // Request timeout in ms (default: 10000)
}
```

## Error Handling

```typescript
import { GalvaError } from '@galva-io/galva-admin-node';

try {
  await galva.billingEvent.appstore(signedPayload, 'user-123');
} catch (error) {
  if (error instanceof GalvaError) {
    console.error(error.code, error.message);
  }
}
```

Common SDK error codes include `MISSING_API_KEY`, `TIMEOUT`, and
`HTTP_<status>`.

## Requirements

- Node.js >= 18.0

## License

MIT
