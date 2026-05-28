import { PlaystoreDeveloperNotification } from './types/playstore';
import { EventEntity } from '@paddle/paddle-node-sdk';
import { GalvaBase, GalvaOptions, BillingEventOptions } from './galvaBase';
import { GalvaWithCreds, CredentialsConfig } from './galvaWithCreds';

/**
 * Discriminated payload for forwarding already-processed platform
 * notifications via `Galva.billingEvent.forwardNotification`.
 */
export type ForwardNotificationPayload =
  | {
      platform: 'appstore';
      signedPayload: string;
      bundleId: string;
      appAppleId: number;
    }
  | {
      platform: 'playstore';
      payload: PlaystoreDeveloperNotification;
    }
  | {
      platform: 'paddle';
      eventEntity: EventEntity;
    };

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
     * @param {BillingEventOptions} [options] - Additional options (set `verbose` to log requests)
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
      options?: BillingEventOptions,
    ): Promise<void> => {
      const { signedPayload, bundleId, appAppleId } = payload;
      await this.sendRequest(
        'POST',
        '/endUsers/billingEvents',
        {
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
        },
        options?.verbose,
      );
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
      options?: BillingEventOptions,
    ): Promise<void> => {
      await this.sendRequest(
        'POST',
        '/endUsers/billingEvents',
        {
          type: 'raw',
          event: {
            platform: 'playstore',
            endUserId,
            payload,
            options,
          },
        },
        options?.verbose,
      );
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
      options?: BillingEventOptions,
    ): Promise<void> => {
      await this.sendRequest(
        'POST',
        '/endUsers/billingEvents',
        {
          type: 'raw',
          event: {
            platform: 'paddle',
            endUserId,
            payload: eventEntity,
            options,
          },
        },
        options?.verbose,
      );
    },

    /**
     * Centralized entry point that forwards an already-processed platform
     * notification. Dispatches to the platform-specific handler based on
     * `payload.platform`.
     * @param {string} endUserId - End user ID
     * @param {ForwardNotificationPayload} payload - Discriminated payload
     * @throws {GalvaError} If API request fails
     * @example
     * ```typescript
     * await galva.billingEvent.forwardNotification('user-123', {
     *   platform: 'playstore',
     *   payload: decodedNotification,
     * });
     * ```
     */
    forwardNotification: async (
      endUserId: string,
      payload: ForwardNotificationPayload,
      options?: BillingEventOptions,
    ): Promise<void> => {
      switch (payload.platform) {
        case 'appstore': {
          const { signedPayload, bundleId, appAppleId } = payload;
          return this.billingEvent.appstore(
            endUserId,
            { signedPayload, bundleId, appAppleId },
            options,
          );
        }
        case 'playstore':
          return this.billingEvent.playstore(
            endUserId,
            payload.payload,
            options,
          );
        case 'paddle':
          return this.billingEvent.paddle(
            endUserId,
            payload.eventEntity,
            options,
          );
      }
    },
  };

  withCredentials(credentials: CredentialsConfig) {
    return new GalvaWithCreds(this.config, credentials);
  }
}
