import { Capacitor, registerPlugin } from "@capacitor/core";
const orientation = registerPlugin("KitchenOrientation");
export function kitchenOrientation(active) {
  if (Capacitor.isNativePlatform()) orientation.set({ active }).catch(() => {});
}
