"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Contact,
  loadContacts,
  saveContacts,
  upsertContact,
  removeContactById,
  createAddressMap,
} from "@/lib/address-book-storage";

// Re-export Contact type for backwards compatibility
export { Contact };

export interface AddressBookEntry {
    address: string;
    name: string;
    addedAt: number;
}

interface AddressBookContextType {
    entries: Record<string, string>; // address -> name mapping
    getName: (address: string) => string | null;
    saveName: (address: string, name: string) => void;
    removeEntry: (address: string) => void;
    allEntries: Contact[];
}

const AddressBookContext = createContext<AddressBookContextType | undefined>(undefined);

export function AddressBookProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Load and migrate from localStorage on mount
    useEffect(() => {
        const { contacts: loadedContacts, importedCount } = loadContacts();
        setContacts(loadedContacts);

        if (importedCount > 0) {
            toast({
                title: `Imported ${importedCount} contacts`,
                description: "Contacts from previous storage were merged into your address book.",
            });
            console.info(`Imported ${importedCount} contacts from legacy address book storage.`);
        }

        setInitialized(true);
    }, [toast]);

    // Persist to localStorage when contacts change
    useEffect(() => {
        if (!initialized) return;
        saveContacts(contacts);
    }, [contacts, initialized]);

    const getName = useCallback((address: string) => {
        return contacts.find((contact) => contact.address === address)?.name || null;
    }, [contacts]);

    const saveName = useCallback((address: string, name: string) => {
        setContacts(prev => upsertContact(prev, name, address));
    }, []);

    const removeEntry = useCallback((address: string) => {
        setContacts(prev => {
            const contact = prev.find((c) => c.address === address);
            return contact ? removeContactById(prev, contact.id) : prev;
        });
    }, []);

    const entryMap = createAddressMap(contacts);

    const value: AddressBookContextType = {
        entries: entryMap,
        getName,
        saveName,
        removeEntry,
        allEntries: contacts,
    };

    return (
        <AddressBookContext.Provider value={value}>
            {children}
        </AddressBookContext.Provider>
    );
}

export function useAddressBook() {
    const context = useContext(AddressBookContext);
    if (context === undefined) {
        throw new Error("useAddressBook must be used within an AddressBookProvider");
    }
    return context;
}
