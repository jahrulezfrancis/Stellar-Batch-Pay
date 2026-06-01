import { useState, useEffect } from 'react';
import {
  Contact,
  loadContacts,
  saveContacts,
  upsertContact,
  removeContactById,
} from '@/lib/address-book-storage';

export { Contact };

export function useAddressBook() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { contacts: loadedContacts } = loadContacts();
    setContacts(loadedContacts);
    setIsLoading(false);
  }, []);

  const saveContactsAndUpdate = (newContacts: Contact[]) => {
    setContacts(newContacts);
    saveContacts(newContacts);
  };

  const addContact = (name: string, address: string) => {
    setContacts(prev => {
      const updated = upsertContact(prev, name, address);
      saveContacts(updated);
      return updated;
    });
  };

  const updateContact = (id: string, name: string, address: string) => {
    setContacts(prev => {
      // Find and remove old contact, then add updated one
      const filtered = removeContactById(prev, id);
      const updated = upsertContact(filtered, name, address);
      saveContacts(updated);
      return updated;
    });
  };

  const deleteContact = (id: string) => {
    setContacts(prev => {
      const updated = removeContactById(prev, id);
      saveContacts(updated);
      return updated;
    });
  };

  const exportContacts = () => {
    const dataStr = JSON.stringify(contacts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'stellar-batch-pay-contacts.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importContacts = (jsonStr: string) => {
    try {
      const imported = JSON.parse(jsonStr);
      if (Array.isArray(imported)) {
        // Basic validation
        const valid = imported.every(
          (c) => typeof c.name === 'string' && typeof c.address === 'string'
        );
        if (valid) {
          setContacts(prev => {
            let updated = [...prev];
            imported.forEach((newContact) => {
              if (!updated.find((m) => m.address === newContact.address)) {
                updated.push({
                  id: newContact.id || crypto.randomUUID(),
                  name: newContact.name,
                  address: newContact.address,
                  addedAt: newContact.addedAt || Date.now(),
                });
              }
            });
            saveContacts(updated);
            return updated;
          });
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Failed to import contacts:', e);
      return false;
    }
  };

  return {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
    exportContacts,
    importContacts,
  };
}
