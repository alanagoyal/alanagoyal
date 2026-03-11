import { createClient } from "@/utils/supabase/server";
import {
  decodeMessagesSeedContacts,
  FALLBACK_MESSAGE_CONTACTS,
  type MessagesSeedContact,
} from "@/lib/messages/seed-content";

const contactsCache = { value: null as MessagesSeedContact[] | null };
let contactsRequest: Promise<MessagesSeedContact[] | null> | null = null;

export async function getMessagesSeedContacts(): Promise<MessagesSeedContact[]> {
  if (contactsCache.value) {
    return contactsCache.value;
  }

  if (contactsRequest) {
    return (await contactsRequest) ?? FALLBACK_MESSAGE_CONTACTS;
  }

  contactsRequest = (async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("messages_seed_contacts")
        .select("name,title,prompt,bio")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error || !data) {
        if (error) {
          console.warn("Failed to fetch messages seed contacts:", error.message);
        }
        return null;
      }

      const decoded = decodeMessagesSeedContacts(data);
      if (decoded !== null) {
        contactsCache.value = decoded;
      }
      return decoded;
    } catch (error) {
      console.warn("Unexpected messages seed contacts error:", error);
      return null;
    } finally {
      contactsRequest = null;
    }
  })();

  return (await contactsRequest) ?? FALLBACK_MESSAGE_CONTACTS;
}
