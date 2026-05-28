import type { EndUserTraits, EndUserDefaultInfo } from './types/endUser';
import { END_USER_DEFAULT_INFO_TO_TRAIT_MAP } from './types/endUser';
import { GalvaError } from './types/error';

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
 * Per-call options for billing event methods.
 * @interface BillingEventOptions
 */
export interface BillingEventOptions {
  /** Logs the API request, success, and error responses to the console. */
  verbose?: boolean;
  /** Arbitrary additional options forwarded to the API. */
  [key: string]: any;
}

const PRODUCTION_API_URL = 'https://api.galva.dev';
const DEVELOPMENT_API_URL = 'https://api.galva.dev';

/**
 * Base Galva SDK client with end user management methods.
 * @class GalvaBase
 */
export class GalvaBase {
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
    verbose?: boolean,
  ): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    if (verbose) {
      console.log(
        `[Galva] Request: ${method} ${endpoint}`,
        data ? JSON.stringify(data) : '',
      );
    } else {
      console.log(`[Galva] Request: ${method} ${endpoint}`);
    }

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
        if (verbose) {
          console.error(
            `[Galva] Request failed: ${method} ${endpoint} (${response.status})`,
            JSON.stringify(errorResponse),
          );
        } else {
          console.error(
            `[Galva] Request failed: ${method} ${endpoint} (${response.status})`,
          );
        }
        throw new GalvaError(errorResponse);
      }

      if (verbose) {
        const body = await response.text();
        console.log(
          `[Galva] Response: ${method} ${endpoint} (${response.status})`,
          body,
        );
      } else {
        console.log(
          `[Galva] Response: ${method} ${endpoint} (${response.status})`,
        );
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
