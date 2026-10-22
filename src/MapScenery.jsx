import React from "react";

function SceneArt({ kind }) {
  return (
    <svg viewBox="0 0 180 180" aria-hidden="true">
      <ellipse cx="90" cy="161" rx="72" ry="13" fill="#47342c" opacity=".12" />
      {kind === "restaurant" && (
        <>
          <path d="M18 74L30 43H151L166 74V158H18Z" fill="#d49d72" />
          <path d="M29 58H155V150H29Z" fill="#fff0ce" />
          <path d="M22 54L33 26H149L160 54Z" fill="#a7253e" />
          <rect
            x="58"
            y="17"
            width="65"
            height="35"
            rx="9"
            fill="#fdf0cf"
            stroke="#9a243c"
            strokeWidth="4"
          />
          <text
            x="90"
            y="41"
            textAnchor="middle"
            fill="#ad2940"
            fontSize="23"
            fontWeight="900"
          >
            M
          </text>
          <path d="M25 63H158L166 88H17Z" fill="#c62e44" />
          {[34, 67, 100, 133].map((x) => (
            <path key={x} d={`M${x} 63h16l4 25h-19Z`} fill="#fff0cf" />
          ))}
          <path
            d="M17 88Q25 100 34 88Q42 100 51 88Q59 100 68 88Q76 100 85 88Q93 100 102 88Q110 100 119 88Q127 100 136 88Q144 100 153 88Q159 98 166 88"
            fill="#a52a3e"
          />
          <rect
            x="33"
            y="102"
            width="43"
            height="33"
            rx="3"
            fill="#6d9b9d"
            stroke="#bd956c"
            strokeWidth="4"
          />
          <path
            d="M38 107L70 129M42 105L73 126"
            stroke="#c6ded2"
            strokeWidth="5"
          />
          <rect x="93" y="99" width="45" height="56" rx="4" fill="#754f43" />
          <rect x="99" y="105" width="32" height="33" rx="2" fill="#a6c8ba" />
          <circle cx="130" cy="145" r="3" fill="#f0c46a" />
          <path d="M12 155H167L173 165H7Z" fill="#bc9c78" />
          <rect x="106" y="115" width="22" height="12" rx="3" fill="#fff0ce" />
          <text
            x="117"
            y="123"
            textAnchor="middle"
            fontSize="5"
            fontWeight="900"
            fill="#a32a40"
          >
            ABERTO
          </text>
        </>
      )}
      {kind === "tree" && (
        <>
          <path d="M75 147L78 78H98L104 147Z" fill="#946a48" />
          <path
            d="M85 115L57 89M91 99L117 73"
            stroke="#805d40"
            strokeWidth="7"
          />
          <circle cx="65" cy="66" r="37" fill="#6b9556" />
          <circle cx="114" cy="65" r="36" fill="#729f5a" />
          <circle cx="89" cy="39" r="34" fill="#89b66b" />
          <circle cx="54" cy="50" r="21" fill="#8ebc71" />
          <circle cx="121" cy="43" r="21" fill="#9cc77a" />
          <path
            d="M35 152Q46 125 67 139Q81 119 101 141Q125 121 144 151Z"
            fill="#70975b"
          />
          <circle cx="55" cy="145" r="4" fill="#f4cf78" />
          <circle cx="119" cy="142" r="4" fill="#e5a3a2" />
        </>
      )}
      {kind === "terrace" && (
        <>
          <path
            d="M39 148L47 105M130 148L124 105"
            stroke="#906b4f"
            strokeWidth="6"
          />
          <rect x="29" y="93" width="24" height="37" rx="5" fill="#b92940" />
          <rect x="122" y="93" width="25" height="37" rx="5" fill="#b92940" />
          <path d="M91 143V56" stroke="#86654e" strokeWidth="5" />
          <ellipse cx="90" cy="111" rx="41" ry="13" fill="#ad7d53" />
          <ellipse cx="90" cy="107" rx="41" ry="12" fill="#ebc693" />
          <path d="M22 65Q89-19 158 65Z" fill="#c82e45" />
          <path d="M55 65Q87-19 91 65M91 65Q96-19 126 65" fill="#fff0cb" />
          <path
            d="M22 65Q38 80 55 65Q73 80 91 65Q108 80 126 65Q143 80 158 65"
            fill="#a5273c"
          />
          <rect x="104" y="87" width="10" height="18" rx="2" fill="#f4e9cc" />
          <path
            d="M108 89V76H116"
            fill="none"
            stroke="#b52d42"
            strokeWidth="2"
          />
        </>
      )}
      {kind === "delivery" && (
        <>
          <circle cx="42" cy="144" r="22" fill="#60574d" />
          <circle cx="42" cy="144" r="12" fill="#e6caa0" />
          <circle cx="137" cy="144" r="22" fill="#60574d" />
          <circle cx="137" cy="144" r="12" fill="#e6caa0" />
          <path
            d="M35 124L56 98H92L115 128H139V139H73L55 125Z"
            fill="#ba2b43"
          />
          <path
            d="M102 134L115 89H130"
            fill="none"
            stroke="#914c43"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M69 104H101"
            stroke="#594a42"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <rect
            x="19"
            y="63"
            width="58"
            height="39"
            rx="6"
            fill="#f4e7cb"
            stroke="#ba2b43"
            strokeWidth="4"
          />
          <text
            x="48"
            y="91"
            textAnchor="middle"
            fontWeight="900"
            fontSize="24"
            fill="#b12c41"
          >
            M
          </text>
          <circle cx="119" cy="87" r="8" fill="#ffe4a0" />
        </>
      )}
      {kind === "diner" && (
        <>
          <rect x="16" y="43" width="148" height="108" rx="8" fill="#c89c77" />
          <rect x="25" y="50" width="130" height="84" fill="#fff0d3" />
          <rect x="35" y="58" width="51" height="40" rx="4" fill="#a8c9bf" />
          <path d="M60 58V98M35 78H86" stroke="#dfb989" strokeWidth="4" />
          <rect x="100" y="57" width="44" height="34" rx="3" fill="#54716a" />
          <path
            d="M108 65H137M108 72H130M108 79H135"
            stroke="#d9e8c6"
            strokeWidth="3"
          />
          <path d="M23 105H158V130H23Z" fill="#bd2e42" />
          <path
            d="M17 104H164"
            stroke="#f3cea0"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path d="M29 145H154L166 158H17Z" fill="#ece0c5" />
          {[38, 119].map((x) => (
            <g key={x}>
              <path d={`M${x} 151v-18`} stroke="#816c56" strokeWidth="5" />
              <ellipse cx={x} cy="130" rx="19" ry="7" fill="#993044" />
              <ellipse cx={x} cy="127" rx="19" ry="6" fill="#d74552" />
            </g>
          ))}
          <path d="M113 21V38M131 21V38" stroke="#9d785a" strokeWidth="3" />
          <path d="M99 42Q113 21 126 42M119 42Q132 21 145 42" fill="#c24b49" />
        </>
      )}
      {kind === "fries" && (
        <>
          <rect x="36" y="32" width="109" height="121" rx="9" fill="#c28c61" />
          <rect x="44" y="41" width="93" height="78" rx="4" fill="#f9e7bf" />
          <path
            d="M54 128H127M55 138H111"
            stroke="#f1cc91"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {[60, 73, 87, 100, 113].map((x, i) => (
            <rect
              key={x}
              x={x}
              y={51 + (i % 2) * 7}
              width="10"
              height="43"
              rx="2"
              fill={i % 2 ? "#f9d071" : "#edb248"}
            />
          ))}
          <path d="M49 80Q91 99 131 80L124 111Q90 127 58 111Z" fill="#b72a40" />
          <path
            d="M65 88L69 115M89 94V119M113 89L109 115"
            stroke="#fff1d3"
            strokeWidth="10"
          />
          <circle cx="91" cy="102" r="12" fill="#fff2d4" />
          <text
            x="91"
            y="107"
            textAnchor="middle"
            fontSize="15"
            fontWeight="900"
            fill="#b52b40"
          >
            M
          </text>
        </>
      )}
      {kind === "shelf" && (
        <>
          <path d="M33 24V153M148 24V153" stroke="#927357" strokeWidth="8" />
          {[66, 113, 150].map((y) => (
            <path
              key={y}
              d={`M25 ${y}H155`}
              stroke="#b58c62"
              strokeWidth="9"
              strokeLinecap="round"
            />
          ))}
          {[43, 76, 111].map((x, i) => (
            <g key={x}>
              <rect
                x={x}
                y="34"
                width="22"
                height="27"
                rx="4"
                fill={["#c63345", "#f2c660", "#86a897"][i]}
              />
              <rect
                x={x + 5}
                y="28"
                width="12"
                height="9"
                rx="2"
                fill="#e9d0a4"
              />
              <rect
                x={x + 4}
                y="44"
                width="14"
                height="8"
                rx="2"
                fill="#fff1d0"
              />
            </g>
          ))}
          <path d="M40 84H78L72 109H46Z" fill="#eee3c9" />
          <path d="M95 80H137L130 109H101Z" fill="#b52a40" />
          <path
            d="M42 133H87M98 132H134"
            stroke="#e5c392"
            strokeWidth="11"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "menu" && (
        <>
          <path
            d="M49 149L65 40M133 149L117 40"
            stroke="#927154"
            strokeWidth="7"
          />
          <rect x="41" y="25" width="103" height="114" rx="7" fill="#b7895a" />
          <rect x="49" y="33" width="87" height="98" rx="3" fill="#54766d" />
          <text
            x="92"
            y="56"
            textAnchor="middle"
            fill="#f5e3bd"
            fontSize="12"
            fontWeight="900"
          >
            MENU
          </text>
          <path d="M66 80Q91 51 116 80Z" fill="#e8b661" />
          <path
            d="M64 87H118"
            stroke="#88ae6d"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M68 95H114"
            stroke="#d49b55"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M64 111H118M75 119H108"
            stroke="#c7d7b4"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "kitchen" && (
        <>
          <rect x="20" y="76" width="140" height="80" rx="6" fill="#7c9292" />
          <rect x="28" y="104" width="74" height="42" rx="4" fill="#344f57" />
          <path
            d="M37 113H92M37 121H92M37 129H92"
            stroke="#6e9295"
            strokeWidth="3"
          />
          <rect x="111" y="109" width="37" height="36" rx="3" fill="#9db5ad" />
          <path
            d="M122 116V138"
            stroke="#4e6b70"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M15 78H165"
            stroke="#b9cebd"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <ellipse cx="56" cy="80" rx="22" ry="8" fill="#3a5055" />
          <ellipse cx="122" cy="80" rx="22" ry="8" fill="#3a5055" />
          <path
            d="M41 69Q39 51 52 45Q51 60 59 57Q63 46 64 40Q78 54 70 69"
            fill="#e8a44f"
          />
          <path
            d="M108 68Q103 48 117 40Q117 55 124 50Q127 39 133 42Q144 62 134 68"
            fill="#e1b35f"
          />
          <path d="M32 18H150L164 45H17Z" fill="#a8bbb1" />
          <path d="M31 35H149" stroke="#57777a" strokeWidth="3" />
          <path
            className="scene-steam"
            d="M63 57Q48 46 63 33M118 56Q105 44 118 32"
            stroke="#f9efd3"
            strokeWidth="5"
            opacity=".6"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="47" cy="99" r="4" fill="#e0c78b" />
          <circle cx="74" cy="99" r="4" fill="#e0c78b" />
        </>
      )}
      {kind === "pan" && (
        <>
          <path
            d="M23 31H156"
            stroke="#7d9694"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path d="M49 35V70M126 35V78" stroke="#bdcbb9" strokeWidth="5" />
          <circle cx="49" cy="94" r="25" fill="#879d95" />
          <circle cx="49" cy="94" r="18" fill="#435e64" />
          <path d="M105 83H146L141 128Q126 141 111 128Z" fill="#9caf9f" />
          <path d="M108 91H143" stroke="#e1dcc0" strokeWidth="4" />
          <path
            d="M111 61Q104 51 113 42M132 62Q124 52 132 43"
            fill="none"
            stroke="#fff1d0"
            strokeWidth="4"
            strokeLinecap="round"
            className="scene-steam"
          />
        </>
      )}
      {kind === "cart" && (
        <>
          <path d="M25 83H155V144H25Z" fill="#78948e" />
          <path
            d="M18 82H161"
            stroke="#b6cab5"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path d="M43 95V136M135 95V136" stroke="#45646a" strokeWidth="5" />
          <circle cx="42" cy="151" r="10" fill="#43575a" />
          <circle cx="137" cy="151" r="10" fill="#43575a" />
          <rect x="44" y="53" width="92" height="25" rx="5" fill="#d8c092" />
          <path d="M52 62H127M56 69H122" stroke="#a88a60" strokeWidth="3" />
          <path
            d="M48 46Q61 20 80 41Q100 15 118 42L128 54H40Z"
            fill="#87ac66"
          />
          <circle cx="68" cy="45" r="9" fill="#dc7960" />
          <circle cx="103" cy="44" r="9" fill="#d55c4e" />
        </>
      )}
      {kind === "chef" && (
        <>
          <path
            d="M50 91Q20 66 43 45Q49 21 77 35Q101 14 119 37Q151 37 143 65Q151 88 128 94L124 131H54Z"
            fill="#fff2d5"
            stroke="#d4c6a5"
            strokeWidth="4"
          />
          <path d="M55 105H128V137H55Z" fill="#f0ddaf" />
          <path
            d="M75 77V101M98 72V101M118 81V101"
            stroke="#d6c9a9"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M36 144H145L152 158H29Z" fill="#b82f44" />
          <path
            d="M59 150H123"
            stroke="#edbda1"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M144 27L147 35 156 37 149 43 150 52 142 47 134 51 136 42 129 35 139 34Z"
            fill="#e2b15c"
          />
        </>
      )}
    </svg>
  );
}
const props = [
  ["restaurant", "terrace", "tree", "delivery"],
  ["diner", "fries", "shelf", "menu"],
  ["kitchen", "pan", "cart", "chef"],
];
export function MapScenery({ zone, top }) {
  return (
    <div
      className={`world-scenery scenery-${zone}`}
      style={{ top }}
      aria-hidden="true"
    >
      {props[zone].map((kind, index) => (
        <div key={kind} className={`scenery-prop prop-${index} prop-${kind}`}>
          <SceneArt kind={kind} />
        </div>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <i className={`floor-detail floor-detail-${i}`} key={i} />
      ))}
    </div>
  );
}
