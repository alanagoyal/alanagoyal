import { headers } from "next/headers";
import { isMobileBySignals } from "@/lib/device-detection";

export async function isMobileRequest(): Promise<boolean> {
  const requestHeaders = await headers();

  return isMobileBySignals({
    clientHintMobile: requestHeaders.get("sec-ch-ua-mobile") === "?1",
    userAgent: requestHeaders.get("user-agent") ?? "",
  });
}
