"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Conversation } from "@/types/messages";
import {
  decodeMessagesSeedContacts,
  decodeMessagesSeedConversations,
  FALLBACK_MESSAGE_CONTACTS,
  FALLBACK_MESSAGE_CONVERSATIONS,
  type MessagesSeedContact,
} from "@/lib/messages/seed-content";

const contactsCache = { value: null as MessagesSeedContact[] | null };
const conversationsCache = { value: null as Conversation[] | null };
let contactsRequest: Promise<MessagesSeedContact[] | null> | null = null;
let conversationsRequest: Promise<Conversation[] | null> | null = null;

async function fetchMessagesSeedContacts(): Promise<MessagesSeedContact[] | null> {
  if (contactsCache.value) return contactsCache.value;
  if (contactsRequest) return await contactsRequest;

  contactsRequest = (async () => {
    try {
      const supabase = createClient();
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

  return await contactsRequest;
}

async function fetchMessagesSeedConversations(): Promise<Conversation[] | null> {
  if (conversationsCache.value) return conversationsCache.value;
  if (conversationsRequest) return await conversationsRequest;

  conversationsRequest = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages_seed_conversations")
        .select("payload")
        .order("sort_order", { ascending: true })
        .order("conversation_id", { ascending: true });

      if (error || !data) {
        if (error) {
          console.warn("Failed to fetch messages seed conversations:", error.message);
        }
        return null;
      }

      const payloads = data.map((row) => row.payload);
      const decoded = decodeMessagesSeedConversations(payloads);
      if (decoded !== null) {
        conversationsCache.value = decoded;
      }
      return decoded;
    } catch (error) {
      console.warn("Unexpected messages seed conversations error:", error);
      return null;
    } finally {
      conversationsRequest = null;
    }
  })();

  return await conversationsRequest;
}

export function useMessagesSeedContacts() {
  const [contacts, setContacts] = useState<MessagesSeedContact[]>(
    FALLBACK_MESSAGE_CONTACTS
  );

  useEffect(() => {
    let cancelled = false;

    setContacts(FALLBACK_MESSAGE_CONTACTS);

    void fetchMessagesSeedContacts().then((nextContacts) => {
      if (!cancelled && nextContacts !== null) {
        setContacts(nextContacts);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return contacts;
}

export function useMessagesSeedConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(
    FALLBACK_MESSAGE_CONVERSATIONS
  );

  useEffect(() => {
    let cancelled = false;

    setConversations(FALLBACK_MESSAGE_CONVERSATIONS);

    void fetchMessagesSeedConversations().then((nextConversations) => {
      if (!cancelled && nextConversations !== null) {
        setConversations(nextConversations);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return conversations;
}
