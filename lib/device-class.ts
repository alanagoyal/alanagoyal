export const DEVICE_CLASS_COOKIE = "app_device_class";

export type DeviceClass = "mobile" | "desktop";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function parseDeviceClass(value: string | null | undefined): DeviceClass | null {
  if (value === "mobile" || value === "desktop") {
    return value;
  }
  return null;
}

export function deviceClassFromIsMobile(isMobile: boolean): DeviceClass {
  return isMobile ? "mobile" : "desktop";
}

export function persistDeviceClassCookie(isMobile: boolean) {
  if (typeof document === "undefined") return;

  const value = deviceClassFromIsMobile(isMobile);
  const cookieParts = document.cookie.split(";").map((part) => part.trim());
  const existingPart = cookieParts.find((part) => part.startsWith(`${DEVICE_CLASS_COOKIE}=`));
  const existingValue = parseDeviceClass(existingPart?.split("=")[1]);

  if (existingValue === value) return;

  document.cookie =
    `${DEVICE_CLASS_COOKIE}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
