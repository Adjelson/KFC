import { Capacitor, registerPlugin } from "@capacitor/core";
const orientation = registerPlugin("KitchenOrientation");
export function kitchenOrientation(active, immersive = false) {
  if (Capacitor.isNativePlatform())
    orientation.set({ active, immersive }).catch(() => {});
}
