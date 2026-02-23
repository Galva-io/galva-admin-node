import { BillingPlatformType } from "../enums";
import { AppstoreWebhookBody } from "./appstore";
import { PlaystoreDeveloperNotification } from "./playstore";
import { PaddleWebhookBody } from "./paddle";

export * from "./appstore";
export * from "./playstore";
export * from "./paddle";

export interface RawBillingEventAppstore {
  platform: Extract<BillingPlatformType, "appstore">;
  payload: AppstoreWebhookBody;
  endUserId: string;
}

export interface RawBillingEventPlaystore {
  platform: Extract<BillingPlatformType, "playstore">;
  payload: PlaystoreDeveloperNotification;
  endUserId: string;
}

export interface RawBillingEventPaddle {
  platform: Extract<BillingPlatformType, "paddle">;
  payload: PaddleWebhookBody;
  endUserId: string;
}

export type RawBillingEvent =
  | RawBillingEventAppstore
  | RawBillingEventPlaystore
  | RawBillingEventPaddle;
