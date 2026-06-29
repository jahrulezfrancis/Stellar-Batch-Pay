/**
 * Centralized address book storage with migration support.
 *
 * This module handles persistent storage of contacts with backwards compatibility
 * for legacy storage keys. It provides a single source of truth for address book data.
 */

export interface Contact {
  id: string;
  name: string;
  address: string;
  addedAt: number;
}

const CANONICAL_STORAGE_KEY = 'stellar-batch-pay-address-book';
const LEGACY_STORAGE_KEYS = ['batchpay_address_book'];

interface StoredContact {
  id?: string;
  name?: unknown;
  address?: unknown;
  addedAt?: unknown;
}

/**
 * Parse and normalize stored contact data from any source format
 */
function normalizeContact(raw: StoredContact): Contact | null {
  if (typeof raw.name !== 'string' || typeof raw.address !== 'string') {
    return null;
  }

  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    name: raw.name,
    address: raw.address,
    addedAt: typeof raw.addedAt === 'number' ? raw.addedAt : 0,
  };
}

/**
 * Parse contacts from raw JSON string, handling both old and new formats
 */
function parseStoredContacts(raw: string | null): Contact[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredContact[];
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      const normalized = normalizeContact(item);
      return normalized ? [normalized] : [];
    });
  } catch (err) {
    console.error('Failed to parse address book:', err);
    return [];
  }
}

/**
 * Merge contacts from multiple sources, keeping newest version per address
 */
function mergeContacts(contactGroups: Contact[][]): { contacts: Contact[]; importedCount: number } {
  const merged = new Map<string, Contact>();
  let importedCount = 0;

  contactGroups.forEach((contacts, groupIndex) => {
    contacts.forEach((contact) => {
      const existing = merged.get(contact.address);
      const shouldUseContact = !existing || contact.addedAt >= existing.addedAt;

      if (shouldUseContact) {
        merged.set(contact.address, contact);
      }

      // Count imports from legacy sources (groupIndex > 0)
      if (groupIndex > 0 && shouldUseContact) {
        importedCount += 1;
      }
    });
  });

  return {
    contacts: Array.from(merged.values()).sort((a, b) => b.addedAt - a.addedAt),
    importedCount,
  };
}

/**
 * Load contacts from localStorage with automatic migration from legacy keys
 * Call this on app initialization to ensure all data is in the canonical location
 */
export function loadContacts(): { contacts: Contact[]; importedCount: number } {
  // Load from canonical key
  const canonicalContacts = parseStoredContacts(localStorage.getItem(CANONICAL_STORAGE_KEY));

  // Load from legacy keys
  const legacyContacts = LEGACY_STORAGE_KEYS.map((key) =>
    parseStoredContacts(localStorage.getItem(key))
  );

  // Merge all sources
  const { contacts, importedCount } = mergeContacts([canonicalContacts, ...legacyContacts]);

  // Write back to canonical location
  saveContacts(contacts);

  // Clean up legacy keys
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

  return { contacts, importedCount };
}

/**
 * Save contacts to localStorage (canonical key only)
 */
export function saveContacts(contacts: Contact[]): void {
  localStorage.setItem(CANONICAL_STORAGE_KEY, JSON.stringify(contacts));
}

/**
 * Get a contact by address
 */
export function getContactByAddress(contacts: Contact[], address: string): Contact | undefined {
  return contacts.find((c) => c.address === address);
}

/**
 * Add or update a contact
 */
export function upsertContact(contacts: Contact[], name: string, address: string): Contact[] {
  const existing = contacts.find((c) => c.address === address);
  const now = Date.now();

  if (!existing) {
    return [
      ...contacts,
      {
        id: crypto.randomUUID(),
        name,
        address,
        addedAt: now,
      },
    ];
  }

  return contacts.map((c) => (
    c.address === address ? { ...c, name, addedAt: now } : c
  ));
}

/**
 * Remove a contact by ID
 */
export function removeContactById(contacts: Contact[], id: string): Contact[] {
  return contacts.filter((c) => c.id !== id);
}

/**
 * Create an address-to-name map for quick lookups
 */
export function createAddressMap(contacts: Contact[]): Record<string, string> {
  return contacts.reduce<Record<string, string>>((map, contact) => {
    map[contact.address] = contact.name;
    return map;
  }, {});
}
