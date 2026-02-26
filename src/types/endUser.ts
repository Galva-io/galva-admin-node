/**
 * Default trait names for end user profiles.
 * Use these constants for type-safe access to built-in traits.
 */
export enum EndUserDefaultTraitName {
  TIMEZONE = "$gv_timezone",
  LANGUAGE_CODE = "$gv_languageCode",
  EMAIL = "$gv_email",
  FULL_NAME = "$gv_fullName",
  FIRST_NAME = "$gv_firstName",
  LAST_NAME = "$gv_lastName",
  COUNTRY = "$gv_country",
  TOTAL_LIFETIME_VALUE = "$gv_totalLifetimeValue",
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
  [EndUserDefaultTraitName.TOTAL_LIFETIME_VALUE]?: number;
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
  totalLifetimeValue?: number;
}

/**
 * Mapping from friendly parameter names to original trait names.
 * TypeScript ensures this mapping contains all keys from EndUserDefaultTraitName.
 */
export const END_USER_DEFAULT_TRAIT_MAP: Record<
  EndUserDefaultTraitName,
  keyof EndUserDefaultInfo
> = {
  [EndUserDefaultTraitName.TIMEZONE]: "timezone",
  [EndUserDefaultTraitName.LANGUAGE_CODE]: "languageCode",
  [EndUserDefaultTraitName.EMAIL]: "email",
  [EndUserDefaultTraitName.FULL_NAME]: "fullName",
  [EndUserDefaultTraitName.FIRST_NAME]: "firstName",
  [EndUserDefaultTraitName.LAST_NAME]: "lastName",
  [EndUserDefaultTraitName.COUNTRY]: "country",
  [EndUserDefaultTraitName.TOTAL_LIFETIME_VALUE]: "totalLifetimeValue",
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
  totalLifetimeValue: EndUserDefaultTraitName.TOTAL_LIFETIME_VALUE,
};
