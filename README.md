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
```

You can also set the API key with the `GALVA_API_KEY` environment variable.

## Forward Billing Events

Pass the original provider notification to the matching SDK method. Galva
validates and processes it using the integration associated with your API key.
An end-user ID is optional and can be included when the user is already known.

| Provider | What to pass |
|---|---|
| App Store | The `signedPayload` from an App Store Server Notification |
| Google Play | The base64 `message.data` value from Google Pub/Sub |
| Paddle | The exact raw request body and `Paddle-Signature` header |

```typescript
await galva.billingEvent.appstore(signedPayload, 'user-123');
await galva.billingEvent.playstore(base64Payload, 'user-123');
await galva.billingEvent.paddle(rawBody, signature, 'user-123');
```

Omit the final `endUserId` argument when the notification cannot yet be linked
to a user. For Paddle, do not parse and re-serialize the request body before
passing it to the SDK; signature verification requires the original raw body.

## End User Management

```typescript
import { EndUserDefaultTraitName } from '@galva-io/galva-admin-node';

await galva.endUser.identify('user-123', {
  traits: {
    [EndUserDefaultTraitName.EMAIL]: 'user@example.com',
    [EndUserDefaultTraitName.FULL_NAME]: 'John Doe',
    customTrait: 'value',
  },
});
```

Use `updateDefaultInfo` when you prefer friendly property names such as
`email`, `fullName`, and `country`. Use `identify` for custom traits or when you
need to include context and a timestamp.

## Configuration

| Option | Description | Default |
|---|---|---|
| `apiKey` | API key from the Galva dashboard; falls back to `GALVA_API_KEY` | Required |
| `environment` | `production` or `sandbox` | `production` |
| `timeout` | Request timeout in milliseconds | `10000` |

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
