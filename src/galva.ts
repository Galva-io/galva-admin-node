import { PlaystoreDeveloperNotification } from './types/playstore';
import { PlaystoreService } from './services/playstore';
import { EventEntity, Paddle } from '@paddle/paddle-node-sdk';
import type { EndUserTraits, EndUserDefaultInfo } from './types/endUser';
import { END_USER_DEFAULT_INFO_TO_TRAIT_MAP } from './types/endUser';
import { GalvaError } from './types/error';

export type {
  EndUserDefaultTraits,
  EndUserTraits,
  EndUserDefaultInfo,
} from './types/endUser';
export {
  EndUserDefaultTraitName,
  END_USER_DEFAULT_TRAIT_MAP,
  END_USER_DEFAULT_INFO_TO_TRAIT_MAP,
} from './types/endUser';
export { GalvaError } from './types/error';
export type { GalvaErrorResponse } from './types/error';

export interface GalvaOptions {
  /**
   * Defaults to 'production'. Falls back to NODE_ENV.
   * @type {('production' | 'development')}
   */
  environment?: 'production' | 'development';

  /**
   * API key from Galva dashboard. Falls back to GALVA_API_KEY env var.
   * @type {string}
   */
  apiKey?: string;

  /**
   * Request timeout in ms. Defaults to 10000.
   * @type {number}
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

const PRODUCTION_API_URL = 'https://api.galva.dev';
const DEVELOPMENT_API_URL = 'https://api.galva.dev';

/**
 * Base Galva SDK client with end user management methods.
 * @class GalvaBase
 */
class GalvaBase {
  protected config: GalvaOptions;
  protected readonly baseUrl: string;

  /**
   * @param {GalvaOptions} [options] - Configuration options
   * @throws {GalvaError} If API key is not provided
   */
  constructor(options?: GalvaOptions) {
    const apiKey = options?.apiKey || process.env.GALVA_API_KEY;
    if (!apiKey) {
      throw new GalvaError({
        code: 'MISSING_API_KEY',
        message:
          'API key is required. Provide it in options or set GALVA_API_KEY env variable.',
      });
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

  protected async sendRequest(
    method: 'POST' | 'GET',
    endpoint: string,
    data?: unknown,
  ): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(
      `GALVA API REQUEST ${method} ${endpoint}`,
      data ? JSON.stringify(data) : '',
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.log(
          `GALVA API ERROR ${method} ${endpoint} ${response.status}`,
          JSON.stringify(errorResponse),
        );
        throw new GalvaError(errorResponse);
      }
    } catch (error) {
      if (error instanceof GalvaError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GalvaError({
          code: 'TIMEOUT',
          message: `Request timed out after ${this.config.timeout}ms`,
        });
      }
      throw GalvaError.from(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** End user management methods. */
  public endUser = {
    /**
     * Identifies an end user with optional traits and context.
     * @param {string} endUserId - End user ID in your system
     * @param {Object} [options] - Identification data
     * @param {string} [options.timestamp] - ISO 8601 timestamp
     * @param {Record<string, any>} [options.context] - Additional context
     * @param {EndUserTraits} [options.traits] - User traits. Use EndUserDefaultTraitName for built-in traits.
     * @throws {GalvaError} If API request fails
     * @example
     * ```typescript
     * await galva.endUser.identify('user-123', {
     *   traits: { [EndUserDefaultTraitName.EMAIL]: 'user@example.com' },
     * });
     * ```
     */
    identify: async (
      endUserId: string,
      options?: {
        timestamp?: string;
        context?: Record<string, any>;
        traits?: EndUserTraits;
      },
    ): Promise<void> => {
      await this.sendRequest('POST', '/endUsers:identify', {
        endUserId,
        timestamp: options?.timestamp,
        context: options?.context,
        traits: options?.traits,
      });
    },

    /**
     * Updates an end user's default profile info.
     * @param {string} endUserId - End user ID in your system
     * @param {EndUserDefaultInfo} defaultInfo - Profile info to update
     * @throws {GalvaError} If API request fails
     * @example
     * ```typescript
     * await galva.endUser.updateDefaultInfo('user-123', {
     *   email: 'user@example.com',
     *   fullName: 'John Doe',
     * });
     * ```
     */
    updateDefaultInfo: async (
      endUserId: string,
      defaultInfo: EndUserDefaultInfo,
    ): Promise<void> => {
      const traits: EndUserTraits = {};

      for (const [key, value] of Object.entries(defaultInfo)) {
        if (value !== undefined) {
          const traitName =
            END_USER_DEFAULT_INFO_TO_TRAIT_MAP[key as keyof EndUserDefaultInfo];
          traits[traitName] = value;
        }
      }

      await this.sendRequest('POST', '/endUsers:identify', {
        endUserId,
        traits,
      });
    },
  };
}

class GalvaWithCreds extends GalvaBase {
  // private config: GalvaOptions;
  // private readonly baseUrl: string;
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
  };
}

export class Galva extends GalvaBase {
  constructor(options?: GalvaOptions) {
    super(options);
  }

  /**
   * Billing event handlers for different payment platforms.
   * @property {Function} appstore - App Store events
   * @property {Function} playstore - Play Store events (decoded payload)
   * @property {Function} paddle - Paddle events (verified event)
   */
  public billingEvent = {
    /**
     * Tracks an App Store billing event.
     * @param {string} endUserId - End user ID
     * @param {Object} payload - App Store notification payload
     * @param {string} payload.signedPayload - Signed payload from Apple
     * @param {string} payload.bundleId - App bundle identifier
     * @param {number} payload.appAppleId - App Apple ID
     * @param {Record<string, any>} [options] - Additional options
     * @throws {GalvaError} If API request fails
     * @example
     * ```typescript
     * await galva.billingEvent.appstore('user-123', {
     *   signedPayload,
     *   bundleId: 'com.example.app',
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
    ): Promise<void> => {
      const { signedPayload, bundleId, appAppleId } = payload;
      await this.sendRequest('POST', '/endUsers/billingEvents', {
        type: 'raw',
        event: {
          platform: 'appstore',
          endUserId,
          payload: {
            signedPayload,
            appAppleId: appAppleId,
            bundleId: bundleId,
            environment:
              this.config.environment === 'development'
                ? 'Sandbox'
                : 'Production',
          },
          options,
        },
      });
    },

    /**
     * Tracks a Play Store billing event with decoded notification.
     * @param {string} endUserId - End user ID
     * @param {PlaystoreDeveloperNotification} payload - Decoded developer notification
     * @returns {Promise<void>}
     * @example
     * ```typescript
     * await galva.billingEvent.playstore('user-123', decodedNotification);
     * ```
     */
    playstore: async (
      endUserId: string,
      payload: PlaystoreDeveloperNotification,
    ): Promise<void> => {
      await this.sendRequest('POST', '/endUsers/billingEvents', {
        type: 'raw',
        event: {
          platform: 'playstore',
          endUserId,
          payload,
        },
      });
    },

    /**
     * Tracks a Paddle billing event with verified event entity.
     * @param {string} endUserId - End user ID
     * @param {EventEntity} eventEntity - Verified Paddle event
     * @returns {Promise<void>}
     * @example
     * ```typescript
     * await galva.billingEvent.paddle('user-123', verifiedEvent);
     * ```
     */
    paddle: async (
      endUserId: string,
      eventEntity: EventEntity,
    ): Promise<void> => {
      await this.sendRequest('POST', '/endUsers/billingEvents', {
        type: 'raw',
        event: {
          platform: 'paddle',
          endUserId,
          payload: eventEntity,
        },
      });
    },
  };

  withCredentials(credentials: CredentialsConfig) {
    return new GalvaWithCreds(this.config, credentials);
  }
}
