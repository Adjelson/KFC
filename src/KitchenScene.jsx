import React from "react";
import restaurantScene from "./assets/restaurant-scene.webp";
import customersAtlas from "./assets/customer-atlas.webp";
export { customersAtlas };
let ready;
export function preloadKitchenScene() {
  if (!ready)
    ready = Promise.all(
      [restaurantScene, customersAtlas].map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              if (img.decode)
                img
                  .decode()
                  .catch(() => {})
                  .then(resolve);
              else resolve();
            };
            img.onerror = resolve;
            img.src = src;
          }),
      ),
    );
  return ready;
}
export function KitchenScene() {
  return (
    <div className="restaurant-scene" aria-hidden="true">
      <div className="scene-warmth" />
      <span className="counter-engraving">MONTA &amp; TREINA</span>
      <div className="counter-light" />
    </div>
  );
}
