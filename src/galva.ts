import { PlaystoreDeveloperNotification } from "./types/playstore";
import { PlaystoreService } from "./services/playstore";
import { EventEntity, Paddle } from "@paddle/paddle-node-sdk";
import type { EndUserTraits, EndUserDefaultInfo } from "./types/endUser";
import { END_USER_DEFAULT_INFO_TO_TRAIT_MAP } from "./types/endUser";
import { GalvaError } from "./types/error";

export type {
  EndUserDefaultTraits,
  EndUserTraits,
  EndUserDefaultInfo,
} from "./types/endUser";
export {
  EndUserDefaultTraitName,
  END_USER_DEFAULT_TRAIT_MAP,
  END_USER_DEFAULT_INFO_TO_TRAIT_MAP,
} from "./types/endUser";
export { GalvaError } from "./types/error";
export type { GalvaErrorResponse } from "./types/error";

export interface GalvaOptions {
  /**
   * Environment, can be defined as NODE_ENV or directly in options. Defaults to 'production'.
   *
   * @type {('production' | 'development')}
   * @memberof GalvaOptions
   */
  environment?: "production" | "development";

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

const PRODUCTION_API_URL = "https://api.galva.io";
const DEVELOPMENT_API_URL = "https://api.galva.dev";

/**
 * Galva SDK client for tracking billing events from various payment platforms.
 * Use this class when you have already decoded/verified payloads.
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
 *
 * // Track a Play Store billing event with decoded payload
 * await galva.billingEvent.playstore('user-123', decodedNotification);
 *
 * // Track a Paddle billing event with verified event
 * await galva.billingEvent.paddle('user-123', verifiedEvent);
 * ```
 */
export class Galva {
  protected config: GalvaOptions;
  protected readonly baseUrl: string;

  /**
   * Creates a new Galva client instance.
   *
   * @param {GalvaOptions} [options] - Configuration options for the Galva client
   * @throws {Error} Throws if API key is not provided in options or GALVA_API_KEY environment variable
   */
  constructor(options?: GalvaOptions) {
    const apiKey = options?.apiKey || process.env.GALVA_API_KEY;
    if (!apiKey) {
      throw new GalvaError({
        code: "MISSING_API_KEY",
        message:
          "API key is required. Provide it in options or set GALVA_API_KEY env variable.",
      });
    }

    this.config = {
      apiKey: apiKey,
      environment:
        options?.environment ||
        (process.env.NODE_ENV === "development" ? "development" : "production"),
      timeout: options?.timeout || 10000,
    };
    this.baseUrl =
      this.config.environment === "development"
        ? DEVELOPMENT_API_URL
        : PRODUCTION_API_URL;
  }

  protected async sendRequest(
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
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey!,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new GalvaError(errorResponse);
      }
    } catch (error) {
      if (error instanceof GalvaError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new GalvaError({
          code: "TIMEOUT",
          message: `Request timed out after ${this.config.timeout}ms`,
        });
      }
      throw GalvaError.from(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Creates a GalvaWithCreds instance with pre-configured credentials.
   * Use this when you want to pass raw payloads that need decoding/verification.
   *
   * @param {CredentialsConfig} credentials - Credentials for various platforms
   * @returns {GalvaWithCreds} A new GalvaWithCreds instance
   *
   * @example
   * ```typescript
   * const galvaWithCreds = galva.withCredentials({
   *   appstore: {
   *     bundleId: 'com.example.app',
   *     appAppleId: 123456789
   *   },
   *   playstore: {
   *     email: 'service-account@project.iam.gserviceaccount.com',
   *     key: '-----BEGIN PRIVATE KEY-----\n...'
   *   },
   *   paddle: {
   *     apiKey: 'your-paddle-api-key',
   *     secretKey: 'your-webhook-secret'
   *   }
   * });
   *
   * // Now use raw payloads
   * await galvaWithCreds.billingEvent.appstore('user-123', signedPayload);
   * await galvaWithCreds.billingEvent.playstore('user-123', base64Payload);
   * await galvaWithCreds.billingEvent.paddle('user-123', rawBody, signature);
   * ```
   */
  public withCredentials(credentials: CredentialsConfig): GalvaWithCreds {
    return new GalvaWithCreds(this.config, this.baseUrl, credentials);
  }

  /**
   * Billing event handlers for different payment platforms.
   *
   * @property {Function} appstore - Handle Apple App Store billing events
   * @property {Function} playstore - Handle Google Play Store billing events (decoded payload)
   * @property {Function} paddle - Handle Paddle billing events (verified event)
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
     * @throws {GalvaError} Throws if the API request fails
     * @example
     * ```typescript
     * try {
     *   await galva.billingEvent.appstore('user-123', {
     *     signedPayload: signedPayloadFromApple,
     *     bundleId: 'com.example.myapp',
     *     appAppleId: 123456789
     *   });
     * } catch (error) {
     *   if (error instanceof GalvaError) {
     *     console.error(error.code, error.message);
     *   }
     * }
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
      await this.sendRequest("POST", "/endUsers/billingEvents", {
        platform: "appstore",
        endUserId,
        payload: {
          signedPayload,
          appAppleId: appAppleId,
          bundleId: bundleId,
          env: this.config.environment,
        },
        options,
      });
    },

    /**
     * Tracks a Google Play Store billing event for a specific end user.
     * Use this method when you have an already-decoded developer notification.
     *
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {PlaystoreDeveloperNotification} payload - Decoded developer notification object
     * @returns {Promise<void>}
     *
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
        platform: 'playstore',
        endUserId,
        payload,
      });
    },

    /**
     * Tracks a Paddle billing event for a specific end user.
     * Use this method when you have an already-verified Paddle event entity.
     *
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {EventEntity} eventEntity - Already-verified Paddle event entity
     * @returns {Promise<void>}
     *
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
        platform: 'paddle',
        endUserId,
        payload: eventEntity,
      });
    },
  };
}

/**
 * Galva SDK client with pre-configured credentials for tracking billing events.
 * Use this class when you need to pass raw payloads that require decoding/verification.
 * Obtain an instance via `galva.withCredentials(...)`.
 *
 * @class GalvaWithCreds
 * @example
 * ```typescript
 * const galvaWithCreds = new Galva({ apiKey: 'your-api-key' }).withCredentials({
 *   appstore: {
 *     bundleId: 'com.example.app',
 *     appAppleId: 123456789
 *   },
 *   playstore: {
 *     email: 'service-account@project.iam.gserviceaccount.com',
 *     key: '-----BEGIN PRIVATE KEY-----\n...'
 *   },
 *   paddle: {
 *     apiKey: 'your-paddle-api-key',
 *     secretKey: 'your-webhook-secret'
 *   }
 * });
 *
 * // Track an App Store billing event with signed payload
 * await galvaWithCreds.billingEvent.appstore('user-123', signedPayload);
 *
 * // Track a Play Store billing event with base64 payload
 * await galvaWithCreds.billingEvent.playstore('user-123', base64Payload);
 *
 * // Track a Paddle billing event with raw body
 * await galvaWithCreds.billingEvent.paddle('user-123', rawBody, signature);
 * ```
 */
class GalvaWithCreds {
  private config: GalvaOptions;
  private readonly baseUrl: string;
  private credentials: CredentialsConfig;

  /**
   * Creates a new GalvaWithCreds client instance.
   * This constructor is internal - use `galva.withCredentials(...)` instead.
   *
   * @internal
   */
  constructor(config: GalvaOptions, baseUrl: string, credentials: CredentialsConfig) {
    this.config = config;
    this.baseUrl = baseUrl;
    this.credentials = credentials;
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

  /**
   * Billing event handlers for different payment platforms with credential support.
   *
   * @property {Function} appstore - Handle Apple App Store billing events (signed payload only)
   * @property {Function} playstore - Handle Google Play Store billing events (raw base64 payload)
   * @property {Function} paddle - Handle Paddle billing events (raw body with verification)
   */
  public billingEvent = {
    /**
     * Tracks an Apple App Store billing event for a specific end user.
     * Uses the bundleId and appAppleId from withCredentials().
     *
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {string} signedPayload - The signed payload from Apple's server notification
     * @param {Record<string, any>} [options] - Additional options to pass with the request
     * @returns {Promise<{ success: boolean; error?: string }>} Result object indicating success or failure
     * @throws {Error} If appstore credentials were not provided in withCredentials()
     *
     * @example
     * ```typescript
     * await galvaWithCreds.billingEvent.appstore('user-123', signedPayload);
     * ```
     */
    appstore: async (
      endUserId: string,
      signedPayload: string,
      options?: Record<string, any>,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!this.credentials.appstore) {
        throw new Error(
          'App Store credentials are required. Provide them in withCredentials().',
        );
      }

      try {
        await this.sendRequest('POST', '/endUsers/billingEvents', {
          platform: 'appstore',
          endUserId,
          payload: {
            signedPayload,
            appAppleId: this.credentials.appstore.appAppleId,
            bundleId: this.credentials.appstore.bundleId,
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
     * Decodes the base64 payload and fetches subscription details from Play Store API.
     *
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {string} base64Payload - Base64-encoded payload from Google Pub/Sub
     * @returns {Promise<void>}
     * @throws {Error} If playstore credentials were not provided in withCredentials()
     *
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
        throw new Error(
          'Play Store credentials are required. Provide them in withCredentials().',
        );
      }

      const decodedPayloadString = Buffer.from(base64Payload, 'base64').toString();
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
        platform: 'playstore',
        endUserId,
        payload: finalPayload,
      });
    },

    /**
     * Tracks a Paddle billing event for a specific end user.
     * Verifies the webhook signature and unmarshals the event.
     *
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {string} rawBody - Raw request body from Paddle webhook
     * @param {string} signature - Signature from the Paddle-Signature header
     * @returns {Promise<void>}
     * @throws {Error} If paddle credentials were not provided in withCredentials()
     *
     * @example
     * ```typescript
     * await galvaWithCreds.billingEvent.paddle('user-123', rawBody, req.headers['paddle-signature']);
     * ```
     */
    paddle: async (
      endUserId: string,
      rawBody: string,
      signature: string,
    ): Promise<void> => {
      if (!this.credentials.paddle) {
        throw new Error(
          'Paddle credentials are required. Provide them in withCredentials().',
        );
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
        throw new Error(
          `Invalid Paddle webhook data: ${(error as Error).message}`,
        );
      }

      await this.sendRequest('POST', '/endUsers/billingEvents', {
        platform: 'paddle',
        endUserId,
        payload: eventData,
      });
    },
  };

  /**
   * End user management methods.
   */
  public endUser = {
    /**
     * Identifies an end user with optional traits and context.
     *
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {Object} [options] - Optional identification data
     * @param {string} [options.timestamp] - ISO 8601 timestamp of when the identification occurred
     * @param {Record<string, any>} [options.context] - Additional context about the identification
     * @param {EndUserTraits} [options.traits] - User traits/attributes to associate with the user. Use EndUserDefaultTraitName enum for built-in traits.
     * @throws {GalvaError} Throws if the API request fails
     * @example
     * ```typescript
     * import { EndUserDefaultTraitName, GalvaError } from 'galva';
     *
     * try {
     *   await galva.endUser.identify('user-123', {
     *     timestamp: new Date().toISOString(),
     *     traits: {
     *       [EndUserDefaultTraitName.EMAIL]: 'user@example.com',
     *       [EndUserDefaultTraitName.FULL_NAME]: 'John Doe',
     *       plan: 'premium', // custom trait
     *     },
     *     context: { source: 'web-app' }
     *   });
     * } catch (error) {
     *   if (error instanceof GalvaError) {
     *     console.error(error.code, error.message);
     *   }
     * }
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
      await this.sendRequest("POST", "/endUsers:identify", {
        endUserId,
        timestamp: options?.timestamp,
        context: options?.context,
        traits: options?.traits,
      });
    },

    /**
     * Updates an end user's default profile info (default traits).
     *
     * @param {string} endUserId - Unique identifier for the end user in your system
     * @param {EndUserDefaultInfo} defaultInfo - User profile info to update
     * @throws {GalvaError} Throws if the API request fails
     * @example
     * ```typescript
     * import { GalvaError } from 'galva';
     *
     * try {
     *   await galva.endUser.updateDefaultInfo('user-123', {
     *     email: 'user@example.com',
     *     fullName: 'John Doe',
     *     country: 'US',
     *     timezone: 'America/New_York',
     *   });
     * } catch (error) {
     *   if (error instanceof GalvaError) {
     *     console.error(error.code, error.message);
     *   }
     * }
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

      await this.sendRequest("POST", "/endUsers:identify", {
        endUserId,
        traits,
      });
    },
  };
}
