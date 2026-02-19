import { headers } from "next/headers";
import { isMobileUserAgent } from "@/lib/device/is-mobile-user-agent";

export async function getIsMobileRequest(): Promise<boolean> {
  const headerStore = await headers();
  return isMobileUserAgent(headerStore.get("user-agent"));
}
