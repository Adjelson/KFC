import React, { useLayoutEffect, useRef, useState } from "react";

const seeds = (
  <g fill="#fff0bf">
    <ellipse cx="35" cy="22" rx="2" ry="1" transform="rotate(-25 35 22)" />
    <ellipse cx="52" cy="16" rx="2" ry="1" />
    <ellipse cx="68" cy="23" rx="2" ry="1" transform="rotate(30 68 23)" />
    <ellipse cx="46" cy="28" rx="2" ry="1" />
    <ellipse cx="61" cy="29" rx="2" ry="1" />
  </g>
);

export function FoodArt({ id, className = "" }) {
  const bun = ["seeds", "mini", "brioche", "top"].includes(id);
  return (
    <svg
      className={`food-art ${className}`}
      viewBox="0 0 104 64"
      aria-hidden="true"
    >
      <ellipse cx="52" cy="54" rx="40" ry="5" fill="#3f2719" opacity=".12" />
      {id.startsWith("fries-") && (
        <g
          transform={`translate(52 55) scale(${id.endsWith("small") ? 0.72 : id.endsWith("medium") ? 0.86 : 1}) translate(-52 -55)`}
        >
          {[23, 32, 41, 50, 59, 68, 77].map((x, i) => (
            <rect
              key={x}
              x={x}
              y={8 + (i % 3) * 3}
              width="8"
              height="36"
              rx="2"
              fill={i % 2 ? "#ffd46b" : "#efae36"}
              transform={`rotate(${(i - 3) * 3} ${x} 40)`}
            />
          ))}
          <path d="M17 29Q52 42 87 29L80 57Q52 65 24 57Z" fill="#b72236" />
          <path
            d="M28 35L32 59M48 39L49 62M68 37L66 60"
            stroke="#fff1d2"
            strokeWidth="9"
          />
          <ellipse cx="52" cy="46" rx="11" ry="9" fill="#fff5db" />
          <text
            x="52"
            y="50"
            textAnchor="middle"
            fontSize="11"
            fontWeight="900"
            fill="#a62537"
          >
            {id.endsWith("small") ? "P" : id.endsWith("medium") ? "M" : "G"}
          </text>
        </g>
      )}
      {bun && (
        <>
          <path
            d="M11 40C12 0 92 0 93 40Q52 52 11 40"
            fill={id === "brioche" ? "#b96a21" : "#dc9736"}
          />
          <path
            d="M14 36C18 3 87 3 90 36Q52 43 14 36"
            fill={id === "brioche" ? "#efb24b" : "#f4ba58"}
          />
          <path d="M13 40Q52 48 91 40L88 48Q52 57 16 48Z" fill="#c47c2d" />
          {id !== "brioche" && seeds}
        </>
      )}
      {id === "base" && (
        <>
          <path d="M10 32Q52 20 94 32L91 46Q52 57 13 46Z" fill="#d5943c" />
          <ellipse cx="52" cy="32" rx="42" ry="9" fill="#f4d190" />
        </>
      )}
      {["fillet", "tender"].includes(id) && (
        <g transform={id === "tender" ? "translate(10 7) scale(.8 .8)" : ""}>
          <path
            d="M9 35L15 25 24 27 29 18 38 22 49 15 58 22 70 18 76 26 87 23 95 35 90 44 79 45 73 51 59 47 48 52 37 46 25 50 19 44 10 45Z"
            fill="#ae541a"
          />
          <path
            d="M10 32L19 20 27 24 34 14 44 20 52 13 61 21 74 17 80 25 90 25 94 34 85 39 73 38 66 45 53 40 41 44 30 39 19 43Z"
            fill="#f2b348"
          />
          <g fill="#d18629">
            <circle cx="24" cy="31" r="4" />
            <circle cx="44" cy="28" r="4" />
            <circle cx="64" cy="29" r="5" />
            <circle cx="82" cy="32" r="3" />
            <circle cx="52" cy="36" r="3" />
          </g>
        </g>
      )}
      {id === "lettuce" && (
        <>
          <path
            d="M9 37L17 23 26 30 32 15 43 24 52 13 61 25 74 17 79 29 91 25 96 39 85 43 77 38 66 49 55 41 42 48 30 40 18 47Z"
            fill="#4c912e"
          />
          <path
            d="M14 34L23 28 32 35 40 23 50 32 60 24 70 35 82 29 91 36 79 40 67 37 56 43 44 36 31 42Z"
            fill="#8cc54a"
          />
        </>
      )}
      {id === "tomato" && (
        <>
          <ellipse cx="44" cy="36" rx="31" ry="15" fill="#c53525" />
          <ellipse cx="44" cy="31" rx="31" ry="15" fill="#f66545" />
          <ellipse cx="44" cy="31" rx="23" ry="10" fill="#dc442e" />
          <path d="M44 21V41M22 31H66" stroke="#f98d58" strokeWidth="3" />
          <ellipse cx="73" cy="40" rx="21" ry="10" fill="#ee5334" />
        </>
      )}
      {id === "cheese" && (
        <>
          <path d="M11 24L62 16 95 32 50 52 12 37Z" fill="#d39512" />
          <path d="M11 21L62 13 95 29 50 48 12 34Z" fill="#ffce46" />
          <circle cx="40" cy="26" r="3" fill="#edaf27" />
          <circle cx="65" cy="31" r="4" fill="#edaf27" />
        </>
      )}
      {id === "bacon" && (
        <>
          <path
            d="M12 30Q27 17 40 28T67 28 93 22L94 35Q80 48 66 39T39 40 13 44Z"
            fill="#a33c2d"
          />
          <path
            d="M12 33Q27 22 40 32T67 32 93 27"
            fill="none"
            stroke="#ee9872"
            strokeWidth="5"
          />
          <path
            d="M17 40Q28 32 39 38T65 36"
            fill="none"
            stroke="#d97554"
            strokeWidth="3"
          />
        </>
      )}
      {["mayo", "bbq", "cheddar"].includes(id) && (
        <>
          <ellipse cx="52" cy="38" rx="31" ry="14" fill="#d9dddb" />
          <path d="M21 36L28 51Q52 61 76 51L83 36Z" fill="#eceee9" />
          <ellipse
            cx="52"
            cy="34"
            rx="31"
            ry="13"
            fill={
              id === "mayo" ? "#fff0bf" : id === "bbq" ? "#6b3124" : "#f3a521"
            }
          />
          <path
            d="M32 33Q47 25 69 34"
            fill="none"
            stroke={id === "bbq" ? "#94503b" : "#fff5cf"}
            strokeWidth="3"
            strokeLinecap="round"
            opacity=".65"
          />
        </>
      )}
    </svg>
  );
}

export function Burger({ items, compact = false, action, fit = false }) {
  const stack = useRef(null),
    [fitScale, setFitScale] = useState(1);
  const bread = items.filter((id) => ["seeds", "mini", "brioche"].includes(id));
  const fillings = [
    ...items.filter((id) => ["mayo", "bbq"].includes(id)),
    ...items.filter((id) => ["fillet", "tender", "cheese"].includes(id)),
    ...items.filter((id) =>
      ["bacon", "cheddar", "tomato", "lettuce"].includes(id),
    ),
  ];
  const layers = [...(bread.length ? ["base"] : []), ...fillings, ...bread];
  useLayoutEffect(() => {
    if (!fit || !stack.current) return;
    const parent = stack.current.parentElement;
    const measure = () =>
      setFitScale(
        Math.min(
          1,
          Math.max(
            0.25,
            (parent.clientHeight - 36) /
              (105 + Math.max(0, layers.length - 1) * 11),
          ),
          parent.clientWidth / 270,
        ),
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [fit, items]);
  return (
    <div
      ref={stack}
      style={fit ? { "--fit": fitScale } : undefined}
      className={`burger-stack ${compact ? "compact" : ""}`}
      role="img"
      aria-label={
        items.length
          ? items.some((id) => id.startsWith("fries-"))
            ? "Porção de batatas"
            : `Sanduíche com ${items.length} ingredientes`
          : "Bandeja vazia"
      }
    >
      <div className="plate" />
      {items.find((id) => id.startsWith("fries-")) && (
        <FoodArt
          id={items.find((id) => id.startsWith("fries-"))}
          className="assembled-fries"
        />
      )}
      {layers.map((id, index) => (
        <div
          key={`${id}-${index}`}
          className={`burger-layer layer-${id} ${action?.id === id && !action.remove ? "fresh-layer" : ""}`}
          style={{ "--layer": index, "--count": layers.length }}
        >
          <FoodArt id={id} />
        </div>
      ))}
    </div>
  );
}

export function Customer({ number = 1 }) {
  const skin = ["#dba274", "#f1c69b", "#e4b18c", "#ac714d", "#f0cfb2"][
    (number - 1) % 5
  ];
  const shirt = ["#c3293b", "#457d85", "#78549a", "#bb7932", "#54855b"][
    (number - 1) % 5
  ];
  return (
    <svg viewBox="0 0 70 80" aria-hidden="true">
      <path d="M8 80V65Q35 48 62 65V80" fill={shirt} />
      <path d="M26 60L35 70 44 60V80H26Z" fill="#fff3db" />
      <path d="M14 33C10 0 59 0 57 34L54 55H17Z" fill="#603f31" />
      <ellipse cx="35" cy="36" rx="20" ry="25" fill={skin} />
      <path
        d="M14 29C11 4 61 -1 57 30Q49 24 45 16Q32 32 14 29"
        fill="#603f31"
      />
      <circle cx="27" cy="36" r="2" fill="#4b3027" />
      <circle cx="43" cy="36" r="2" fill="#4b3027" />
      <path
        d="M29 47Q35 53 41 47"
        fill="none"
        stroke="#9e4c3d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="22" cy="44" r="3" fill="#d67c61" opacity=".5" />
      <circle cx="48" cy="44" r="3" fill="#d67c61" opacity=".5" />
    </svg>
  );
}
