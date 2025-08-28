import { useState } from "react";
import { Contact } from "../types";
import toast from "react-hot-toast";

interface AddressBookProps {
  addressBook: Contact[];
  setAddressBook: (contacts: Contact[]) => void;
  prefillData?: {
    name?: string;
    address?: string;
    publicKey?: string;
  };
}

export default function AddressBook({
  addressBook,
  setAddressBook,
  prefillData,
}: AddressBookProps) {
  const [newContact, setNewContact] = useState<Contact>({
    name: prefillData?.name || "",
    address: prefillData?.address || "",
    publicKey: prefillData?.publicKey || "",
  });

  const addToAddressBook = () => {
    if (newContact.name && newContact.address) {
      setAddressBook([...addressBook, newContact]);
      setNewContact({ name: "", address: "", publicKey: "" });
    }
  };

  const removeFromAddressBook = (index: number) => {
    setAddressBook(addressBook.filter((_, i) => i !== index));
  };

  return (
    <section className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
        Address Book
      </h2>

      {/* Add New Contact Form */}
      <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add New Contact</h3>
        <div className="flex flex-col gap-4">
          {/* Row for Contact Name and Address */}
          <div className="flex flex-row gap-4">
            <input
              type="text"
              placeholder="Contact Name"
              value={newContact.name}
              onChange={(e) =>
                setNewContact({ ...newContact, name: e.target.value })
              }
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Address"
              value={newContact.address}
              onChange={(e) =>
                setNewContact({
                  ...newContact,
                  address: e.target.value,
                })
              }
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Row for Public Key */}
          <div className="flex flex-row">
            <input
              type="text"
              placeholder="Public Key"
              value={newContact.publicKey}
              onChange={(e) =>
                setNewContact({
                  ...newContact,
                  publicKey: e.target.value,
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={addToAddressBook}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Contact
        </button>
      </div>

      {/* Address Listing */}
      <div className="space-y-4">
        {addressBook.map((contact, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold">{contact.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Address: {contact.address}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Public Key: {contact.publicKey}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
