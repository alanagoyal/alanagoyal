import { redirect } from "next/navigation";
import { isMobileRequest } from "@/lib/is-mobile-request";
import { getMobileDirectRouteRedirect, isAppSupportedOnMobile } from "@/lib/app-availability";

export async function redirectIfUnsupportedOnMobile(appId: string): Promise<void> {
  const initialIsMobile = await isMobileRequest();
  if (!initialIsMobile) return;
  if (isAppSupportedOnMobile(appId)) return;
  redirect(getMobileDirectRouteRedirect(appId));
}
