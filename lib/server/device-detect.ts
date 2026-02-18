import "server-only";
import { cookies, headers } from "next/headers";
import { DEVICE_CLASS_COOKIE, parseDeviceClass } from "@/lib/device-class";

const MOBILE_UA_REGEX =
  /android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini|silk/i;

export async function detectInitialIsMobile(): Promise<boolean> {
  const cookieStore = await cookies();
  const stickyDeviceClass = parseDeviceClass(
    cookieStore.get(DEVICE_CLASS_COOKIE)?.value
  );
  if (stickyDeviceClass) {
    return stickyDeviceClass === "mobile";
  }

  const requestHeaders = await headers();

  const clientHintMobile = requestHeaders.get("sec-ch-ua-mobile");
  if (clientHintMobile === "?1") {
    return true;
  }

  const userAgent = requestHeaders.get("user-agent") ?? "";
  return MOBILE_UA_REGEX.test(userAgent);
}
