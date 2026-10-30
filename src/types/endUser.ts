/**
 * Default trait names for end user profiles.
 * Use these constants for type-safe access to built-in traits.
 */
export enum EndUserDefaultTraitName {
  TIMEZONE = '$gv_timezone',
  LANGUAGE_CODE = '$gv_languageCode',
  EMAIL = '$gv_email',
  FULL_NAME = '$gv_fullName',
  FIRST_NAME = '$gv_firstName',
  LAST_NAME = '$gv_lastName',
  COUNTRY = '$gv_country',
  APP_ACCOUNT_TOKEN = '$gv_appAccountToken',
  OBFUSCATED_EXTERNAL_ACCOUNT_ID = '$gv_obfuscatedExternalAccountId',
  // Alias of OBFUSCATED_EXTERNAL_ACCOUNT_ID (Billing Library naming).
  OBFUSCATED_ACCOUNT_ID = '$gv_obfuscatedAccountId',
  TOTAL_LIFETIME_VALUE = '$gv_totalLifetimeValue',
  // Epoch millis. FIRST_SEEN_AT is write-once — set on the first session only.
  FIRST_SEEN_AT = '$gv_firstSeenAt',
  LAST_SEEN_AT = '$gv_lastSeenAt',
  // Client-supplied subscription expiry as an ISO 8601 string; fallback when entitlement expiry is unavailable.
  EXPIRES_AT = '$gv_expiresAt',
}

/**
 * Built-in trait types with their expected value types.
 */
export interface EndUserDefaultTraits {
  [EndUserDefaultTraitName.TIMEZONE]?: string;
  [EndUserDefaultTraitName.LANGUAGE_CODE]?: string;
  [EndUserDefaultTraitName.EMAIL]?: string;
  [EndUserDefaultTraitName.FULL_NAME]?: string;
  [EndUserDefaultTraitName.FIRST_NAME]?: string;
  [EndUserDefaultTraitName.LAST_NAME]?: string;
  [EndUserDefaultTraitName.COUNTRY]?: string;
  [EndUserDefaultTraitName.APP_ACCOUNT_TOKEN]?: string;
  [EndUserDefaultTraitName.OBFUSCATED_EXTERNAL_ACCOUNT_ID]?: string;
  [EndUserDefaultTraitName.OBFUSCATED_ACCOUNT_ID]?: string;
  [EndUserDefaultTraitName.TOTAL_LIFETIME_VALUE]?: number;
  [EndUserDefaultTraitName.FIRST_SEEN_AT]?: number;
  [EndUserDefaultTraitName.LAST_SEEN_AT]?: number;
  [EndUserDefaultTraitName.EXPIRES_AT]?: string;
}

/**
 * End user traits combining default traits with arbitrary custom traits.
 */
export type EndUserTraits = EndUserDefaultTraits & Record<string, any>;

/**
 * Friendly parameter names for updating end user default info.
 * Maps to the underlying $gv_ prefixed trait names.
 */
export interface EndUserDefaultInfo {
  timezone?: string;
  languageCode?: string;
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  appAccountToken?: string;
  obfuscatedExternalAccountId?: string;
  obfuscatedAccountId?: string;
  totalLifetimeValue?: number;
  firstSeenAt?: number;
  lastSeenAt?: number;
  expiresAt?: string;
}

/**
 * Mapping from friendly parameter names to original trait names.
 * TypeScript ensures this mapping contains all keys from EndUserDefaultTraitName.
 */
export const END_USER_DEFAULT_TRAIT_MAP: Record<
  EndUserDefaultTraitName,
  keyof EndUserDefaultInfo
> = {
  [EndUserDefaultTraitName.TIMEZONE]: 'timezone',
  [EndUserDefaultTraitName.LANGUAGE_CODE]: 'languageCode',
  [EndUserDefaultTraitName.EMAIL]: 'email',
  [EndUserDefaultTraitName.FULL_NAME]: 'fullName',
  [EndUserDefaultTraitName.FIRST_NAME]: 'firstName',
  [EndUserDefaultTraitName.LAST_NAME]: 'lastName',
  [EndUserDefaultTraitName.COUNTRY]: 'country',
  [EndUserDefaultTraitName.APP_ACCOUNT_TOKEN]: 'appAccountToken',
  [EndUserDefaultTraitName.OBFUSCATED_EXTERNAL_ACCOUNT_ID]:
    'obfuscatedExternalAccountId',
  [EndUserDefaultTraitName.OBFUSCATED_ACCOUNT_ID]: 'obfuscatedAccountId',
  [EndUserDefaultTraitName.TOTAL_LIFETIME_VALUE]: 'totalLifetimeValue',
  [EndUserDefaultTraitName.FIRST_SEEN_AT]: 'firstSeenAt',
  [EndUserDefaultTraitName.LAST_SEEN_AT]: 'lastSeenAt',
  [EndUserDefaultTraitName.EXPIRES_AT]: 'expiresAt',
};

/**
 * Reverse mapping from friendly parameter names to trait names.
 * TypeScript ensures this mapping contains all keys from EndUserDefaultInfo.
 */
export const END_USER_DEFAULT_INFO_TO_TRAIT_MAP: Record<
  keyof EndUserDefaultInfo,
  EndUserDefaultTraitName
> = {
  timezone: EndUserDefaultTraitName.TIMEZONE,
  languageCode: EndUserDefaultTraitName.LANGUAGE_CODE,
  email: EndUserDefaultTraitName.EMAIL,
  fullName: EndUserDefaultTraitName.FULL_NAME,
  firstName: EndUserDefaultTraitName.FIRST_NAME,
  lastName: EndUserDefaultTraitName.LAST_NAME,
  country: EndUserDefaultTraitName.COUNTRY,
  appAccountToken: EndUserDefaultTraitName.APP_ACCOUNT_TOKEN,
  obfuscatedExternalAccountId:
    EndUserDefaultTraitName.OBFUSCATED_EXTERNAL_ACCOUNT_ID,
  obfuscatedAccountId: EndUserDefaultTraitName.OBFUSCATED_ACCOUNT_ID,
  totalLifetimeValue: EndUserDefaultTraitName.TOTAL_LIFETIME_VALUE,
  firstSeenAt: EndUserDefaultTraitName.FIRST_SEEN_AT,
  lastSeenAt: EndUserDefaultTraitName.LAST_SEEN_AT,
  expiresAt: EndUserDefaultTraitName.EXPIRES_AT,
};
