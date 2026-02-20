import { headers } from "next/headers";

const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export async function isMobileRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  const clientHintMobile = requestHeaders.get("sec-ch-ua-mobile");

  if (clientHintMobile === "?1") {
    return true;
  }

  const userAgent = requestHeaders.get("user-agent") || "";
  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
}
