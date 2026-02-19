import { headers } from "next/headers";

const MOBILE_UA_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export async function isMobileRequest(): Promise<boolean> {
  const requestHeaders = await headers();

  const chMobile = requestHeaders.get("sec-ch-ua-mobile");
  if (chMobile === "?1") return true;
  if (chMobile === "?0") return false;

  const userAgent = requestHeaders.get("user-agent") || "";
  return MOBILE_UA_PATTERN.test(userAgent);
}
