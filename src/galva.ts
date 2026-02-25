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

export interface PlaystoreCredentials {
  email: string;
  key: string;
}

export interface PaddleCredentials {
  apiKey: string;
  secretKey: string;
  signature: string;
}

const PRODUCTION_API_URL = 'https://api.galva.io/v1';
const DEVELOPMENT_API_URL = 'https://api.sandbox.galva.io/v1';
export class Galva {
  private config: GalvaOptions;
  private readonly baseUrl: string;

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

  public billingEvent = {
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

    playstore: this._playstore.bind(this),

    paddle: this._paddle.bind(this),
  };
}
