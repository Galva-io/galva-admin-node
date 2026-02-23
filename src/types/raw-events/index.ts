import { AppstoreWebhookBody } from "./appstore";
import { PlaystoreDeveloperNotification } from "./playstore";
import { PaddleWebhookBody } from "./paddle";

export * from "./appstore";
export * from "./playstore";
export * from "./paddle";

export interface RawBillingEventAppstore {
  platform: "appstore";
  payload: AppstoreWebhookBody;
  endUserId: string;
}

export interface RawBillingEventPlaystore {
  platform: "playstore";
  payload: PlaystoreDeveloperNotification;
  endUserId: string;
}

export interface RawBillingEventPaddle {
  platform: "paddle";
  payload: PaddleWebhookBody;
  endUserId: string;
}

export type RawBillingEvent =
  | RawBillingEventAppstore
  | RawBillingEventPlaystore
  | RawBillingEventPaddle;
