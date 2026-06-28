export interface SettingsPreferences {
  version: number;
  defaultNetwork: "testnet" | "mainnet";
  defaultAsset: "xlm" | "usdc" | "usdt";
  batchValidation: boolean;
  completionNotifications: boolean;
}

const STORAGE_KEY = "batchpay_settings_v1";
const CURRENT_VERSION = 1;

const DEFAULT_PREFERENCES: SettingsPreferences = {
  version: CURRENT_VERSION,
  defaultNetwork: "testnet",
  defaultAsset: "xlm",
  batchValidation: true,
  completionNotifications: true,
};

/**
 * Load settings preferences from localStorage with SSR guard and schema migration
 */
export function loadSettingsPreferences(): SettingsPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored);
    
    // Schema migration: if version is missing or outdated, migrate to current version
    if (!parsed.version || parsed.version < CURRENT_VERSION) {
      const migrated = migrateSettings(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    // Validate and merge with defaults to handle missing fields
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      version: CURRENT_VERSION,
    };
  } catch (error) {
    console.error("Failed to load settings preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Migrate settings from older versions to current version
 */
function migrateSettings(oldSettings: any): SettingsPreferences {
  // Version 0 to 1 migration: add version field and ensure all fields exist
  return {
    version: CURRENT_VERSION,
    defaultNetwork: oldSettings.defaultNetwork ?? DEFAULT_PREFERENCES.defaultNetwork,
    defaultAsset: oldSettings.defaultAsset ?? DEFAULT_PREFERENCES.defaultAsset,
    batchValidation: oldSettings.batchValidation ?? DEFAULT_PREFERENCES.batchValidation,
    completionNotifications: oldSettings.completionNotifications ?? DEFAULT_PREFERENCES.completionNotifications,
  };
}

/**
 * Save settings preferences to localStorage
 */
export function saveSettingsPreferences(preferences: Partial<SettingsPreferences>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = loadSettingsPreferences();
    const updated = {
      ...current,
      ...preferences,
      version: CURRENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save settings preferences:", error);
  }
}

/**
 * Reset settings preferences to defaults
 */
export function resetSettingsPreferences(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
  } catch (error) {
    console.error("Failed to reset settings preferences:", error);
  }
}
