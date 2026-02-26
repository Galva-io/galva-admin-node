import { PlaystoreDeveloperNotification } from './types/playstore';
import { PlaystoreService } from './services/playstore';
import { EventEntity, Paddle } from '@paddle/paddle-node-sdk';

export interface GalvaOptions {
  /**
   * Environment, can be defined as NODE_ENV or directly in options. Defaults to 'production'.
   *
   * @type {('production' | 'development')}
   * @memberof GalvaOptions
   */
  environment?: 'production' | 'development';

  /**
   * API key retrieved from  Galva dashboard. Can also be set via GALVA_API_KEY environment variable.
   *
   * @type {string}
   * @memberof GalvaOptions
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds (optional, defaults to 10000ms)
   *
   * @type {number}
   * @memberof GalvaOptions
   */
  timeout?: number;
}

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
  /** Signature from the Paddle-Signature header */
  signature: string;
}

const PRODUCTION_API_URL = 'https://api.galva.dev';
const DEVELOPMENT_API_URL = 'https://api.galva.dev';

/**
 * Galva SDK client for tracking billing events from various payment platforms.
 *
 * @class Galva
 * @example
 * ```typescript
 * const galva = new Galva({ apiKey: 'your-api-key' });
 *
 * // Track an App Store billing event
 * await galva.billingEvent.appstore('user-123', {
 *   signedPayload: '...',
 *   bundleId: 'com.example.app',
 *   appAppleId: 123456789
 * });
 * ```
 */
export class Galva {
  private config: GalvaOptions;
  private readonly baseUrl: string;

  /**
   * Creates a new Galva client instance.
   *
   * @param {GalvaOptions} [options] - Configuration options for the Galva client
   * @throws {Error} Throws if API key is not provided in options or GALVA_API_KEY environment variable
   */
  constructor(options?: GalvaOptions) {
    const apiKey = options?.apiKey || process.env.GALVA_API_KEY;
    if (!apiKey) {
      throw new Error(
        'API key is required. Provide it in options or set GALVA_API_KEY env variable.',
      );
    }

    this.config = {
      apiKey: apiKey,
      environment:
        options?.environment ||
        (process.env.NODE_ENV === 'development' ? 'development' : 'production'),
      timeout: options?.timeout || 10000,
    };
    this.baseUrl =
      this.config.environment === 'development'
        ? DEVELOPMENT_API_URL
        : PRODUCTION_API_URL;
  }

  private async sendRequest(
    method: 'POST' | 'GET',
    endpoint: string,
    data?: unknown,
  ): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Galva API error: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      } else {
        const responseData = await response.json();
        if (responseData.error) {
          throw new Error(`Galva API error: ${responseData.error}`);
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private _playstore(
    endUserId: string,
    base64Payload: string,
    credentials: PlaystoreCredentials,
  ): Promise<void>;

  private _playstore(
    endUserId: string,
    payload: PlaystoreDeveloperNotification,
  ): Promise<void>;

  private async _playstore(
    endUserId: string,
    base64OrPayload: string | PlaystoreDeveloperNotification,
    credentials?: PlaystoreCredentials,
  ): Promise<void> {
    if (typeof base64OrPayload === 'string') {
      if (!credentials) {
        throw new Error(
          'Credentials are required when payload is provided as base64 string.',
        );
      }

      const decodedPayloadString = Buffer.from(
        base64OrPayload,
        'base64',
      ).toString();
      let decodedPayload: PlaystoreDeveloperNotification | null = null;
      try {
        decodedPayload = JSON.parse(decodedPayloadString);
      } catch (error) {
        throw new Error('Invalid base64 payload: unable to parse JSON.');
      }

      if (!decodedPayload || typeof decodedPayload !== 'object') {
        throw new Error('Decoded payload is not a valid JSON object.');
      }

      if (!('subscriptionNotification' in decodedPayload)) {
        throw new Error(
          'Decoded payload does not contain subscriptionNotification field.',
        );
      }

      const subscription = await PlaystoreService.getSubscription(
        decodedPayload.subscriptionNotification.purchaseToken,
        decodedPayload.packageName,
        credentials,
      );

      const finalPayload: PlaystoreDeveloperNotification = {
        ...decodedPayload,
        subscriptionNotification: {
          ...decodedPayload.subscriptionNotification,
          subscriptionPurchase: subscription.data,
        },
      };

      await this.sendRequest('POST', '/endUsers/billingEvents', {
        platform: 'playstore',
        endUserId,
        payload: finalPayload,
      });
    } else {
    }
  }

  private _paddle(
    endUserId: string,
    rawBody: string,
    auth: PaddleCredentials,
  ): Promise<void>;

  private _paddle(endUserId: string, eventEntity: EventEntity): Promise<void>;

  private async _paddle(
    endUserId: string,
    rawBodyOrEvent: string | EventEntity,
    auth?: PaddleCredentials,
  ): Promise<void> {
    let eventData: EventEntity;

    if (typeof rawBodyOrEvent === 'string') {
      if (!auth) {
        throw new Error(
          'Auth credentials are required when payload is provided as signed body.',
        );
      }

      const paddle = new Paddle(auth.apiKey);
      try {
        eventData = await paddle.webhooks.unmarshal(
          rawBodyOrEvent,
          auth.secretKey,
          auth.signature,
        );
      } catch (error) {
        throw new Error(
          `Invalid Paddle webhook data: ${(error as Error).message}`,
        );
      }
    } else {
      eventData = rawBodyOrEvent;
    }

    await this.sendRequest('POST', '/endUsers/billingEvents', {
      platform: 'paddle',
      endUserId,
      payload: eventData,
    });
  }

  /**
   * Billing event handlers for different payment platforms.
   *
   * @property {Function} appstore - Handle Apple App Store billing events
   * @property {Function} playstore - Handle Google Play Store billing events
   * @property {Function} paddle - Handle Paddle billing events
   */
  public billingEvent = {
    /**
     * Tracks an Apple App Store billing event for a specific end user.
     *
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {Object} payload - App Store notification payload
     * @param {string} payload.signedPayload - The signed payload from Apple's server notification
     * @param {string} payload.bundleId - The app's bundle identifier (e.g., 'com.example.app')
     * @param {number} payload.appAppleId - The app's Apple ID from App Store Connect
     * @param {Record<string, any>} [options] - Additional options to pass with the request
     * @returns {Promise<{ success: boolean; error?: string }>} Result object indicating success or failure
     * @example
     * ```typescript
     * const result = await galva.billingEvent.appstore('user-123', {
     *   signedPayload: signedPayloadFromApple,
     *   bundleId: 'com.example.myapp',
     *   appAppleId: 123456789
     * });
     * ```
     */
    appstore: async (
      endUserId: string,
      payload: {
        signedPayload: string;
        bundleId: string;
        appAppleId: number;
      },
      options?: Record<string, any>,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { signedPayload, bundleId, appAppleId } = payload;
        await this.sendRequest('POST', '/endUsers/billingEvents', {
          platform: 'appstore',
          endUserId,
          payload: {
            signedPayload,
            appAppleId: appAppleId,
            bundleId: bundleId,
            env: this.config.environment,
          },
          options,
        });
        return { success: true };
      } catch (error) {
        console.error('Error syncing App Store event:', error);
        return { success: false, error: (error as Error).message };
      }
    },

    /**
     * Tracks a Google Play Store billing event for a specific end user.
     *
     * @overload
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {string} base64Payload - Base64-encoded payload from Google Pub/Sub
     * @param {PlaystoreCredentials} credentials - Service account credentials for Play Store API
     * @returns {Promise<void>}
     *
     * @overload
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {PlaystoreDeveloperNotification} payload - Already-decoded developer notification object
     * @returns {Promise<void>}
     *
     * @example
     * ```typescript
     * // Using base64 payload from Pub/Sub
     * await galva.billingEvent.playstore('user-123', base64Payload, {
     *   email: 'service-account@project.iam.gserviceaccount.com',
     *   key: '-----BEGIN PRIVATE KEY-----\n...'
     * });
     *
     * // Using already-decoded notification
     * await galva.billingEvent.playstore('user-123', decodedNotification);
     * ```
     */
    playstore: this._playstore.bind(this),

    /**
     * Tracks a Paddle billing event for a specific end user.
     *
     * @overload
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {string} rawBody - Raw request body from Paddle webhook
     * @param {PaddleCredentials} auth - Paddle API credentials for webhook verification
     * @returns {Promise<void>}
     *
     * @overload
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {EventEntity} eventEntity - Already-verified Paddle event entity
     * @returns {Promise<void>}
     *
     * @example
     * ```typescript
     * // Using raw webhook body
     * await galva.billingEvent.paddle('user-123', rawBody, {
     *   apiKey: 'your-paddle-api-key',
     *   secretKey: 'your-webhook-secret',
     *   signature: req.headers['paddle-signature']
     * });
     *
     * // Using already-verified event
     * await galva.billingEvent.paddle('user-123', verifiedEvent);
     * ```
     */
    paddle: this._paddle.bind(this),
  };
}
