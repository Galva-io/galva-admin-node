export interface GalvaOptions {
  /**
   * API base URL (optional, defaults to Galva's production API endpoint)
   *
   * @type {string}
   * @memberof GalvaOptions
   */
  environment?: 'production' | 'development';

  /**
   * Bundle ID of the Application
   *
   * @type {string}
   * @memberof GalvaOptions
   */
  bundleId: string;

  /**
   * App Apple ID of the Application
   *
   * @type {number}
   * @memberof GalvaOptions
   */
  appAppleId: number;

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

const PRODUCTION_API_URL = 'https://api.galva.io/v1';
const DEVELOPMENT_API_URL = 'https://api.sandbox.galva.io/v1';
export class Galva {
  private config: Required<GalvaOptions>;
  private readonly baseUrl: string;

  constructor(options: GalvaOptions) {
    const apiKey = options.apiKey || process.env.GALVA_API_KEY;
    if (!apiKey) {
      throw new Error(
        'API key is required. Provide it in options or set GALVA_API_KEY env variable.',
      );
    }

    this.config = {
      apiKey: apiKey,
      environment: options.environment || 'production',
      bundleId: options.bundleId,
      appAppleId: options.appAppleId,
      timeout: options.timeout || 10000,
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

  public syncRawEvent = {
    appstore: async (
      endUserId: string,
      signedPayload: string,
      options?: Record<string, unknown>,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await this.sendRequest('POST', '/endUsers/billingEvents', {
          platform: 'appstore',
          endUserId,
          payload: {
            signedPayload,
            appAppleId: this.config.appAppleId,
            bundleId: this.config.bundleId,
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
  };
}
