import { PlaystoreDeveloperNotification } from './types/playstore';
import { PlaystoreService } from './services/playstore';
import { EventEntity, Paddle } from '@paddle/paddle-node-sdk';
import { GalvaError } from './types/error';
import { GalvaBase, GalvaOptions } from './galvaBase';

/**
 * Credentials for authenticating with the Google Play Store API.
 *
 * @interface PlaystoreCredentials
 */
export interface PlaystoreCredentials {
  /** Service account email address */
  email: string;
  /** Service account private key */
  key: string;
}

/**
 * Credentials for authenticating and verifying Paddle webhooks.
 *
 * @interface PaddleCredentials
 */
export interface PaddleCredentials {
  /** Paddle API key */
  apiKey: string;
  /** Webhook secret key for signature verification */
  secretKey: string;
}

/**
 * Credentials for Apple App Store.
 *
 * @interface AppstoreCredentials
 */
export interface AppstoreCredentials {
  /** The app's bundle identifier (e.g., 'com.example.app') */
  bundleId: string;
  /** The app's Apple ID from App Store Connect */
  appAppleId: number;
}

/**
 * Credentials configuration for withCredentials method.
 *
 * @interface CredentialsConfig
 */
export interface CredentialsConfig {
  /** App Store credentials */
  appstore?: AppstoreCredentials;
  /** Play Store service account credentials */
  playstore?: PlaystoreCredentials;
  /** Paddle API credentials */
  paddle?: PaddleCredentials;
}

/**
 * Discriminated payload for forwarding raw platform notifications via
 * `GalvaWithCreds.billingEvent.forwardNotification`.
 */
export type ForwardRawNotificationPayload =
  | {
      platform: 'appstore';
      signedPayload: string;
      options?: Record<string, any>;
    }
  | {
      platform: 'playstore';
      base64Payload: string;
      options?: Record<string, any>;
    }
  | {
      platform: 'paddle';
      rawBody: string;
      signature: string;
    };

export class GalvaWithCreds extends GalvaBase {
  private credentials: CredentialsConfig;

  /**
   * @internal Use `galva.withCredentials(...)` instead.
   */
  constructor(config: GalvaOptions, credentials: CredentialsConfig) {
    super(config);
    this.credentials = credentials;
  }

  /**
   * Billing event handlers with credential support.
   * @property {Function} appstore - App Store events (signed payload only)
   * @property {Function} playstore - Play Store events (raw base64 payload)
   * @property {Function} paddle - Paddle events (raw body with verification)
   */
  public billingEvent = {
    /**
     * Tracks an App Store billing event. Uses credentials from withCredentials().
     * @param {string} endUserId - End user ID
     * @param {string} signedPayload - Signed payload from Apple
     * @param {Record<string, any>} [options] - Additional options
     * @returns {Promise<void>}
     * @throws {GalvaError} If credentials missing or API fails
     * @example
     * ```typescript
     * await galvaWithCreds.billingEvent.appstore('user-123', signedPayload);
     * ```
     */
    appstore: async (
      endUserId: string,
      signedPayload: string,
      options?: Record<string, any>,
    ): Promise<void> => {
      if (!this.credentials.appstore) {
        throw new GalvaError({
          code: 'MISSING_CREDENTIALS',
          message:
            'App Store credentials are required. Provide them in withCredentials().',
        });
      }

      const payload = {
        signedPayload,
        type: 'raw',
        event: {
          platform: 'appstore',
          endUserId,
          payload: {
            signedPayload,
            appAppleId: this.credentials.appstore.appAppleId,
            bundleId: this.credentials.appstore.bundleId,
            environment:
              this.config.environment === 'development'
                ? 'Sandbox'
                : 'Production',
          },
          options,
        },
      };

      await this.sendRequest('POST', '/endUsers/billingEvents', payload);
    },

    /**
     * Tracks a Play Store billing event. Decodes payload and fetches subscription details.
     * @param {string} endUserId - End user ID
     * @param {string} base64Payload - Base64 payload from Pub/Sub
     * @returns {Promise<void>}
     * @throws {GalvaError} If credentials missing or API fails
     * @example
     * ```typescript
     * await galvaWithCreds.billingEvent.playstore('user-123', base64Payload);
     * ```
     */
    playstore: async (
      endUserId: string,
      base64Payload: string,
      options?: Record<string, any>,
    ): Promise<void> => {
      if (!this.credentials.playstore) {
        throw new GalvaError({
          code: 'MISSING_CREDENTIALS',
          message:
            'Play Store credentials are required. Provide them in withCredentials().',
        });
      }

      const decodedPayloadString = Buffer.from(
        base64Payload,
        'base64',
      ).toString();
      let decodedPayload: PlaystoreDeveloperNotification | null = null;
      try {
        decodedPayload = JSON.parse(decodedPayloadString);
      } catch (error) {
        throw new GalvaError({
          code: 'INVALID_PAYLOAD',
          message: 'Invalid base64 payload: unable to parse JSON.',
        });
      }

      if (!decodedPayload || typeof decodedPayload !== 'object') {
        throw new GalvaError({
          code: 'INVALID_PAYLOAD',
          message: 'Decoded payload is not a valid JSON object.',
        });
      }

      if (!('subscriptionNotification' in decodedPayload)) {
        throw new GalvaError({
          code: 'INVALID_PAYLOAD',
          message:
            'Decoded payload does not contain subscriptionNotification field.',
        });
      }

      const subscription = await PlaystoreService.getSubscription(
        decodedPayload.subscriptionNotification.purchaseToken,
        decodedPayload.packageName,
        this.credentials.playstore,
      );

      const finalPayload: PlaystoreDeveloperNotification = {
        ...decodedPayload,
        subscriptionNotification: {
          ...decodedPayload.subscriptionNotification,
          subscriptionPurchase: subscription.data,
        },
      };

      await this.sendRequest('POST', '/endUsers/billingEvents', {
        type: 'raw',
        event: {
          platform: 'playstore',
          endUserId,
          payload: finalPayload,
          options,
        },
      });
    },

    /**
     * Tracks a Paddle billing event. Verifies signature and unmarshals the event.
     * @param {string} endUserId - End user ID
     * @param {string} rawBody - Raw body from Paddle webhook
     * @param {string} signature - Paddle-Signature header value
     * @returns {Promise<void>}
     * @throws {GalvaError} If credentials missing or API fails
     * @example
     * ```typescript
     * await galvaWithCreds.billingEvent.paddle('user-123', rawBody, signature);
     * ```
     */
    paddle: async (
      endUserId: string,
      rawBody: string,
      signature: string,
    ): Promise<void> => {
      if (!this.credentials.paddle) {
        throw new GalvaError({
          code: 'MISSING_CREDENTIALS',
          message:
            'Paddle credentials are required. Provide them in withCredentials().',
        });
      }

      const paddle = new Paddle(this.credentials.paddle.apiKey);
      let eventData: EventEntity;

      try {
        eventData = await paddle.webhooks.unmarshal(
          rawBody,
          this.credentials.paddle.secretKey,
          signature,
        );
      } catch (error) {
        throw new GalvaError({
          code: 'INVALID_WEBHOOK',
          message: `Invalid Paddle webhook data: ${(error as Error).message}`,
        });
      }

      await this.sendRequest('POST', '/endUsers/billingEvents', {
        type: 'raw',
        event: {
          platform: 'paddle',
          endUserId,
          payload: eventData,
        },
      });
    },

    /**
     * Centralized entry point that forwards a raw platform notification to
     * Galva. Dispatches to the platform-specific handler based on
     * `payload.platform`.
     * @param {string} endUserId - End user ID
     * @param {ForwardRawNotificationPayload} payload - Discriminated payload
     * @throws {GalvaError} If credentials missing or API fails
     * @example
     * ```typescript
     * await galvaWithCreds.billingEvent.forwardNotification('user-123', {
     *   platform: 'appstore',
     *   signedPayload,
     * });
     * ```
     */
    forwardNotification: async (
      endUserId: string,
      payload: ForwardRawNotificationPayload,
    ): Promise<void> => {
      switch (payload.platform) {
        case 'appstore':
          return this.billingEvent.appstore(
            endUserId,
            payload.signedPayload,
            payload.options,
          );
        case 'playstore':
          return this.billingEvent.playstore(
            endUserId,
            payload.base64Payload,
            payload.options,
          );
        case 'paddle':
          return this.billingEvent.paddle(
            endUserId,
            payload.rawBody,
            payload.signature,
          );
      }
    },
  };
}
