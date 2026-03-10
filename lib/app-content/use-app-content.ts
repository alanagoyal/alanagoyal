"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type AppContentKey = "weather.default_cities";

type Decoder<T> = (payload: unknown) => T | null;

const appContentCache = new Map<AppContentKey, unknown>();
const inflightRequests = new Map<AppContentKey, Promise<unknown | null>>();

async function fetchAppContent<T>(
  key: AppContentKey,
  decode: Decoder<T>
): Promise<T | null> {
  if (appContentCache.has(key)) {
    return appContentCache.get(key) as T;
  }

  const existingRequest = inflightRequests.get(key);
  if (existingRequest) {
    return (await existingRequest) as T | null;
  }

  const request = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("app_content_entries")
        .select("payload")
        .eq("content_key", key)
        .maybeSingle();

      if (error || !data) {
        if (error) {
          console.warn(`Failed to fetch app content for ${key}:`, error.message);
        }
        return null;
      }

      const decoded = decode(data.payload);
      if (decoded !== null) {
        appContentCache.set(key, decoded);
      }
      return decoded;
    } catch (error) {
      console.warn(`Unexpected app content error for ${key}:`, error);
      return null;
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, request);
  return (await request) as T | null;
}

export function useAppContent<T>({
  key,
  fallback,
  decode,
}: {
  key: AppContentKey;
  fallback: T;
  decode: Decoder<T>;
}): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    let cancelled = false;

    setData(fallback);

    void fetchAppContent(key, decode).then((remoteData) => {
      if (!cancelled && remoteData !== null) {
        setData(remoteData);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [decode, fallback, key]);

  return data;
}
