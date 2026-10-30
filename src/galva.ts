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
   * API key from Galva dashboard. Falls back to GALVA_API_KEY env var.
   * @type {string}
   */
  apiKey?: string;

  /**
   * Galva environment. Defaults to production.
   * @type {('production' | 'sandbox')}
   */
  environment?: 'production' | 'sandbox';

  /**
   * Request timeout in ms. Defaults to 10000.
   * @type {number}
   */
  timeout?: number;
}

const ENVIRONMENT_URLS = {
  production: {
    apiUrl: 'https://api.galva.io',
    ingressUrl: 'https://hooks.galva.io',
  },
  sandbox: {
    apiUrl: 'https://api.galva.dev',
    ingressUrl: 'https://hooks.galva.dev',
  },
} as const;

interface ResolvedGalvaOptions {
  apiKey: string;
  baseUrl: string;
  ingressUrl: string;
  timeout: number;
}

/**
 * Base Galva SDK client with end user management methods.
 * @class GalvaBase
 */
class GalvaBase {
  protected config: ResolvedGalvaOptions;

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

    const environment = options?.environment ?? 'production';
    const urls = ENVIRONMENT_URLS[environment];
    this.config = {
      apiKey: apiKey,
      baseUrl: urls.apiUrl,
      ingressUrl: urls.ingressUrl,
      timeout: options?.timeout || 10000,
    };
  }

  protected async sendRequest(
    baseUrl: string,
    method: 'POST' | 'GET',
    endpoint: string,
    data?: unknown,
  ): Promise<void> {
    const url = `${baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseBody = await response.text();
        try {
          const errorResponse = JSON.parse(responseBody) as {
            code?: unknown;
            message?: unknown;
          };
          if (
            typeof errorResponse.code === 'string' &&
            typeof errorResponse.message === 'string'
          ) {
            throw new GalvaError({
              code: errorResponse.code,
              message: errorResponse.message,
            });
          }
        } catch (error) {
          if (error instanceof GalvaError) throw error;
        }

        throw new GalvaError({
          code: `HTTP_${response.status}`,
          message:
            responseBody ||
            response.statusText ||
            `Request failed with status ${response.status}`,
        });
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

  protected sendApiRequest(endpoint: string, data?: unknown): Promise<void> {
    return this.sendRequest(this.config.baseUrl, 'POST', endpoint, data);
  }

  protected sendIngressRequest(
    endpoint: string,
    data?: unknown,
  ): Promise<void> {
    return this.sendRequest(this.config.ingressUrl, 'POST', endpoint, data);
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
      await this.sendApiRequest('/endUsers:identify', {
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

      await this.sendApiRequest('/endUsers:identify', {
        endUserId,
        traits,
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
   * @property {Function} appstore - App Store signed payloads
   * @property {Function} playstore - Google Pub/Sub base64 data
   * @property {Function} paddle - Raw Paddle webhooks
   */
  public billingEvent = {
    /**
     * Tracks an App Store billing event.
     * Accepts `(signedPayload, endUserId?)`.
     * @throws {GalvaError} If API request fails
     * @example
     * ```typescript
     * await galva.billingEvent.appstore(signedPayload, 'user-123');
     * ```
     */
    appstore: async (
      signedPayload: string,
      endUserId?: string,
    ): Promise<void> => {
      await this.sendIngressRequest('/appstore', {
        ...(endUserId === undefined ? {} : { endUserId }),
        signedPayload,
      });
    },

    /**
     * Tracks a Play Store billing event from Pub/Sub base64 data.
     * Accepts `(base64Payload, endUserId?)`.
     * @returns {Promise<void>}
     * @example
     * ```typescript
     * await galva.billingEvent.playstore(base64Payload, 'user-123');
     * ```
     */
    playstore: async (
      base64Payload: string,
      endUserId?: string,
    ): Promise<void> => {
      await this.sendIngressRequest('/playstore', {
        ...(endUserId === undefined ? {} : { endUserId }),
        message: {
          data: base64Payload,
        },
      });
    },

    /**
     * Tracks a raw Paddle webhook for server-side signature verification.
     * Accepts `(rawBody, signature, endUserId?)`.
     * @returns {Promise<void>}
     * @example
     * ```typescript
     * await galva.billingEvent.paddle(rawBody, signature, 'user-123');
     * ```
     */
    paddle: async (
      rawBody: string,
      signature: string,
      endUserId?: string,
    ): Promise<void> => {
      await this.sendIngressRequest('/paddle', {
        ...(endUserId === undefined ? {} : { endUserId }),
        rawBody,
        signature,
      });
    },
  };
}
