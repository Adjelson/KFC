import React, { useEffect, useRef, useState } from "react";
import { Burger } from "./FoodArt.jsx";

// Pointer Events work with touch, mouse and pen in the Android WebView.
// The central plate remains keyboard accessible without a separate send button.
export function DeliverySurface({
  children,
  enabled,
  customerId,
  label,
  items,
  onDeliver,
  onMiss,
}) {
  const gesture = useRef(null);
  const [drag, setDrag] = useState(null);
  useEffect(() => {
    if (gesture.current) clear();
    return () =>
      targets().forEach((node) => node.removeAttribute("data-drop-state"));
  }, [customerId, enabled]);
  function targets() {
    return [...document.querySelectorAll("[data-delivery-customer]")];
  }
  function clear() {
    gesture.current = null;
    setDrag(null);
    targets().forEach((node) => node.removeAttribute("data-drop-state"));
  }
  function targetAt(x, y) {
    return targets().find((node) => {
      const r = node.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  }
  return (
    <div
      className={`delivery-surface ${enabled ? "can-deliver" : ""} ${drag ? "is-dragging" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-disabled={!enabled}
      onKeyDown={(event) => {
        if (enabled && ["Enter", " "].includes(event.key)) {
          event.preventDefault();
          onDeliver();
        }
      }}
      onPointerDown={(event) => {
        if (!enabled || !event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        gesture.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          customerId,
        };
      }}
      onPointerMove={(event) => {
        const origin = gesture.current;
        if (!origin || event.pointerId !== origin.id) return;
        if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 12)
          return;
        setDrag({ x: event.clientX, y: event.clientY });
        const hit = targetAt(event.clientX, event.clientY);
        targets().forEach((node) => {
          const own = node.dataset.deliveryCustomer === customerId;
          node.dataset.dropState =
            node === hit ? (own ? "hover" : "wrong") : own ? "ready" : "other";
        });
      }}
      onPointerUp={(event) => {
        const origin = gesture.current;
        if (!origin || event.pointerId !== origin.id) return;
        const hit = targetAt(event.clientX, event.clientY);
        const moved =
          Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >= 24;
        clear();
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
        if (!enabled || origin.customerId !== customerId || !moved || !hit)
          return;
        if (hit.dataset.deliveryCustomer === customerId) onDeliver();
        else onMiss?.();
      }}
      onPointerCancel={clear}
      onLostPointerCapture={clear}
    >
      {children}
      {enabled && (
        <span className="delivery-cue" aria-hidden="true">
          ↑ Desliza até ao cliente
        </span>
      )}
      {drag && (
        <div
          className="delivery-ghost"
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          <Burger items={items} compact />
        </div>
      )}
    </div>
  );
}
