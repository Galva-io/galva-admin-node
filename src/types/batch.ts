import { IdentifyFromClientPayload } from "./identify";
import { TrackFromClientPayload } from "./track";
import { AliasFromClientPayload } from "./alias";

export type BatchMessage =
  | (IdentifyFromClientPayload & { type: "identify" })
  | (TrackFromClientPayload & { type: "track" })
  | (AliasFromClientPayload & { type: "alias" });
