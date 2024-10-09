export type DeviceType = "mobile" |
  "mobile_landscape_tablet_portrait" |
  "tablet" |
  "desktop";


export const isMobile = (deviceType: string) =>
  deviceType === "mobile" || deviceType === "mobile_landscape_tablet_portrait"
