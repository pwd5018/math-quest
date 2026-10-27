import {
  accentColors,
  defaultAppearance,
  type Appearance,
} from "../lib/appearance";
import { useId } from "react";
export function Fox({
  small = false,
  look = defaultAppearance(),
  cheer = false,
}: {
  small?: boolean;
  look?: Appearance;
  cheer?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const fill = (name: string) => `url(#${id}-${name})`;
  const accent = accentColors[look.accent];
  const coat =
    look.outfit === "wizard"
      ? "#615387"
      : look.outfit === "astronaut"
        ? "#e8f1ec"
        : look.outfit === "raincoat"
          ? "#e9bf59"
          : "#7d9b6b";
  return (
    <svg
      className={`${small ? "fox small" : "fox"} fox-outfit-${look.outfit} ${cheer ? "fox-cheering" : ""}`}
      viewBox="0 0 180 180"
      aria-label={`Pip the friendly fox in a ${look.outfit} outfit`}
      role="img"
    >
      <defs>
        <radialGradient id={`${id}-fur`} cx=".3" cy=".2" r=".95">
          <stop stopColor="#ffbc72" />
          <stop offset=".55" stopColor="#eb9854" />
          <stop offset="1" stopColor="#c9683b" />
        </radialGradient>
        <linearGradient id={`${id}-tail`} x2=".8" y2="1">
          <stop stopColor="#f5ab60" />
          <stop offset="1" stopColor="#c56639" />
        </linearGradient>
        <radialGradient id={`${id}-cream`} cx=".4" cy=".2">
          <stop stopColor="#fffbea" />
          <stop offset="1" stopColor="#eddcba" />
        </radialGradient>
        <linearGradient id={`${id}-coat`} x2=".8" y2="1">
          <stop stopColor={coat} />
          <stop offset=".6" stopColor={coat} />
          <stop offset="1" stopColor="#283d4a" />
        </linearGradient>
        <linearGradient id={`${id}-scarf`} x2=".7" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset=".2" stopColor={accent} />
          <stop offset="1" stopColor={accent} />
        </linearGradient>
        <radialGradient id={`${id}-blush`}>
          <stop stopColor="#e9988b" stopOpacity=".8" />
          <stop offset="1" stopColor="#e9988b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="#385535" stopOpacity=".22" />
          <stop offset="1" stopColor="#385535" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="91" cy="165" rx="58" ry="11" fill={fill("shadow")} />
      <g className="fox-tail">
        <path
          d="M117 111 Q180 87 159 141 Q146 165 112 146"
          fill={fill("tail")}
        />
        <path
          d="M150 109 Q175 108 159 141 L146 150 Q158 125 150 109"
          fill={fill("cream")}
        />
        <path
          d="M132 118Q153 101 158 113"
          stroke="#ffd18c"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity=".65"
        />
      </g>
      <g className="fox-body ambient-motion">
        {look.outfit === "wizard" && (
          <path
            d="M53 108 Q90 92 127 108 L145 155 Q116 163 91 151 Q62 164 39 155Z"
            fill="#8274a7"
          />
        )}
        {look.outfit === "explorer" && (
          <rect x="48" y="105" width="78" height="42" rx="16" fill="#a18c5d" />
        )}
        <path
          d="M53 129 Q49 91 87 94 Q130 96 128 141 L116 158 H64Z"
          fill={fill("fur")}
        />
        <ellipse cx="89" cy="131" rx="24" ry="29" fill={fill("cream")} />
        <path
          d="M55 114 Q90 100 125 115 L126 146 L117 155 H63 L53 145Z"
          fill={fill("coat")}
        />
        <path
          d="M57 118L55 141Q57 149 69 151"
          stroke="#fff8de"
          strokeWidth="2"
          fill="none"
          opacity=".32"
          strokeLinecap="round"
        />
        {look.outfit === "explorer" && (
          <g>
            <path d="M87 112V154" stroke="#d8dfb4" strokeWidth="3" />
            <path d="M59 129H77V142H59Z M101 129H119V142H101Z" fill="#bfd09b" />
            <path
              d="M63 133H74 M104 133H115"
              stroke="#7d9b6b"
              strokeWidth="2"
            />
          </g>
        )}
        {look.outfit === "wizard" && (
          <g fill="#f6dfa0">
            <path d="m89 123 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />
            <circle cx="65" cy="143" r="2" />
            <circle cx="111" cy="146" r="2" />
          </g>
        )}
        {look.outfit === "astronaut" && (
          <g>
            <rect x="76" y="120" width="30" height="24" rx="6" fill="#b9cdd0" />
            <circle cx="85" cy="130" r="3" fill={accent} />
            <path
              d="M94 127H101 M94 133H101"
              stroke="#f8fffc"
              strokeWidth="2"
            />
            <path d="M61 141H73 M110 141H121" stroke={accent} strokeWidth="4" />
          </g>
        )}
        {look.outfit === "raincoat" && (
          <g>
            <path d="M89 116V154" stroke="#c08c36" strokeWidth="2" />
            <circle cx="89" cy="131" r="2.5" fill="#fff1bd" />
            <circle cx="89" cy="143" r="2.5" fill="#fff1bd" />
            <path
              d="M59 132Q68 139 78 132 M101 132Q111 139 121 132"
              stroke="#bd943b"
              fill="none"
              strokeWidth="3"
            />
          </g>
        )}
        <g className="fox-feet">
          <path
            className="fox-foot-left ambient-motion"
            d="M64 151 L61 161Q70 166 78 161L79 151Z"
            fill={
              look.outfit === "raincoat"
                ? "#8c7555"
                : look.outfit === "astronaut"
                  ? "#afc4c5"
                  : "#6e4935"
            }
          />
          <path
            className="fox-foot-right ambient-motion"
            d="M102 151V161Q111 166 120 161L115 150Z"
            fill={
              look.outfit === "raincoat"
                ? "#8c7555"
                : look.outfit === "astronaut"
                  ? "#afc4c5"
                  : "#6e4935"
            }
          />
          <path
            d="M65 160H74 M106 160H115"
            stroke="#fff4d7"
            strokeWidth="1.5"
            opacity=".35"
            strokeLinecap="round"
          />
        </g>
        <g className="fox-arm fox-arm-left">
          <path
            d={cheer ? "M60 122Q35 117 36 99" : "M60 121Q46 137 60 145"}
            stroke={coat}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx={cheer ? 36 : 60}
            cy={cheer ? 98 : 145}
            r="6"
            fill="#e99452"
          />
        </g>
        <g className="fox-arm fox-arm-right">
          <path
            d={cheer ? "M119 122Q144 116 143 99" : "M119 121Q136 136 121 145"}
            stroke={coat}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx={cheer ? 143 : 121}
            cy={cheer ? 98 : 145}
            r="6"
            fill="#e99452"
          />
        </g>
      </g>
      <g className="fox-head ambient-motion">
        <path
          d="M49 63 L42 12 Q67 19 79 43 L111 43 Q124 19 146 14 L136 70Z"
          fill={fill("tail")}
        />
        <path d="M51 47 L50 25 L68 46 M121 46 L138 27 L131 52" fill="#623f3a" />
        <path
          d="M43 64 Q53 35 91 41 Q135 38 143 72 L124 106 Q93 126 59 106Z"
          fill={fill("fur")}
        />
        <path
          d="M44 73 Q59 68 88 95 Q118 68 141 74 Q132 114 92 116 Q55 114 44 73"
          fill={fill("cream")}
        />
        <path
          d="M48 69Q58 47 83 46 M120 48Q132 53 136 64"
          stroke="#ffcd86"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity=".6"
        />
        {cheer ? (
          <path
            d="M65 72 Q72 65 79 73 M106 73 Q113 65 120 72"
            fill="none"
            stroke="#433b35"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : (
          <g className="fox-eyes ambient-motion">
            <ellipse cx="72" cy="76" rx="5.3" ry="7.2" fill="#443a38" />
            <ellipse cx="113" cy="76" rx="5.3" ry="7.2" fill="#443a38" />
            <circle cx="70.5" cy="73.5" r="2" fill="#fffdf4" />
            <circle cx="111.5" cy="73.5" r="2" fill="#fffdf4" />
            <path
              d="M64 64Q72 60 79 64 M106 64Q113 60 120 64"
              stroke="#a95c38"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}
        <path
          d="M83 92 Q91 88 99 92 Q96 103 91 102 Q86 101 83 92"
          fill="#433b35"
        />
        <ellipse cx="88" cy="93" rx="3" ry="1.4" fill="#e4c9ad" opacity=".6" />
        {cheer ? (
          <path
            className="fox-mouth"
            d="M78 103Q92 125 106 103Z"
            fill="#6d4940"
          />
        ) : (
          <path
            className="fox-mouth"
            d="M79 106Q92 114 103 105"
            stroke="#433b35"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        <ellipse cx="60" cy="87" rx="13" ry="8" fill={fill("blush")} />
        <ellipse cx="123" cy="87" rx="13" ry="8" fill={fill("blush")} />
        <path
          d="M51 80l5 2 M127 82l5 -2"
          stroke="#fff4de"
          strokeWidth="2"
          opacity=".65"
          strokeLinecap="round"
        />
        {look.glasses && (
          <g stroke={accent} strokeWidth="3" fill="#e1f5e522">
            <circle cx="71" cy="76" r="13" />
            <circle cx="113" cy="76" r="13" />
            <path
              d="M84 75Q92 70 100 75 M57 73L47 69 M126 73L137 68"
              fill="none"
            />
            <path
              d="M62 73l8 -6 M104 73l8 -6"
              stroke="#fffdf5"
              strokeWidth="2"
              opacity=".7"
              strokeLinecap="round"
            />
          </g>
        )}
        {look.hat === "cap" && (
          <g>
            <path d="M61 43Q62 17 88 19Q115 18 119 44Z" fill={fill("scarf")} />
            <path d="M62 40Q94 35 128 44L126 49Q94 44 62 47Z" fill="#ecdfab" />
            <path
              d="m89 26 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1Z"
              fill="#fff1bd"
            />
          </g>
        )}
        {look.hat === "crown" && (
          <g>
            <path
              d="M65 42L59 20L76 30L90 12L104 30L122 20L115 43Z"
              fill="#edc766"
              stroke="#c89d43"
              strokeWidth="2"
            />
            <path d="M66 39H115" stroke="#fff0b0" strokeWidth="4" />
            <circle cx="90" cy="32" r="4" fill={accent} />
            <path
              d="M64 24L68 35 M90 18V23 M116 25L112 35"
              stroke="#fff1ba"
              strokeWidth="2"
              opacity=".9"
            />
          </g>
        )}
        {look.hat === "flower" && (
          <g transform="translate(125 43)">
            <path
              d="M-20 3Q-3 -15 10 0"
              stroke="#6c9c69"
              strokeWidth="6"
              fill="none"
            />
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <ellipse
                key={angle}
                cy="-8"
                rx="4.5"
                ry="7"
                fill="#fff7df"
                transform={`rotate(${angle})`}
              />
            ))}
            <circle r="5" fill="#e7b94f" />
          </g>
        )}
      </g>
      <path
        d="M53 115Q87 128 127 111L124 125Q86 138 55 126Z"
        fill={fill("scarf")}
      />
      <path
        d="M56 123Q90 134 124 121"
        fill="none"
        stroke="#244b462b"
        strokeWidth="2"
      />
      <path
        className="fox-scarf-end ambient-motion"
        d="M110 125L130 128L119 145L103 131"
        fill={accent}
      />
      <path d="M115 129L121 133" stroke="#fff7df" strokeWidth="2" />
    </svg>
  );
}
export function Landscape() {
  const uid = useId().replace(/:/g, "");
  const paint = (name: string) => `url(#${uid}-${name})`;
  const land =
    "M-28 55 Q66 -1 173 41 Q224 19 281 59 Q357 37 400 78 Q481 61 517 108 Q574 87 645 120 Q748 115 791 186 L803 337 Q733 410 649 395 Q560 450 460 398 Q378 440 309 394 Q194 421 145 370 Q38 390 -18 324Z";
  const river =
    "M323 0 C317 45 316 78 342 103 S373 165 366 193 C361 210 360 229 368 245 S383 294 369 323 S344 374 344 430";
  const trail =
    "M159 296 C201 294 207 195 294 183 C325 180 340 216 362 226 C391 240 399 310 431 290 C460 268 505 192 584 207";
  const trees = [
    [40, 85, 1],
    [85, 64, 0.8],
    [122, 117, 0.7],
    [631, 129, 0.8],
    [683, 126, 1],
    [582, 143, 0.65],
    [546, 354, 0.8],
    [610, 381, 1],
    [658, 345, 0.8],
    [66, 349, 0.9],
    [109, 381, 0.7],
    [286, 88, 0.55],
    [395, 104, 0.6],
  ];
  return (
    <svg
      className="landscape storybook-landscape"
      viewBox="0 0 760 470"
      role="img"
      aria-label="A storybook island with forest meadows, snowy mountain peaks, mushroom cottages, a lighthouse, and a river crossed by a wooden bridge"
    >
      <defs>
        <linearGradient id={`${uid}-water`} x2="0" y2="1">
          <stop stopColor="#d4e9e7" />
          <stop offset=".65" stopColor="#abd5d2" />
          <stop offset="1" stopColor="#d7e9dc" />
        </linearGradient>
        <linearGradient id={`${uid}-land`} x1=".2" x2=".8" y2="1">
          <stop stopColor="#e1edb8" />
          <stop offset=".45" stopColor="#bad69a" />
          <stop offset="1" stopColor="#87b580" />
        </linearGradient>
        <linearGradient id={`${uid}-river`} x2="1" y2=".1">
          <stop stopColor="#63afa9" />
          <stop offset=".45" stopColor="#94d5ca" />
          <stop offset="1" stopColor="#6fbcb7" />
        </linearGradient>
        <linearGradient id={`${uid}-pine`} x1=".15" x2=".9" y2="1">
          <stop stopColor="#82ad79" />
          <stop offset=".45" stopColor="#4f8968" />
          <stop offset="1" stopColor="#386f5b" />
        </linearGradient>
        <linearGradient id={`${uid}-snow`} x2=".8" y2="1">
          <stop stopColor="#fffef0" />
          <stop offset="1" stopColor="#d4e3d5" />
        </linearGradient>
        <linearGradient id={`${uid}-mountain`} x2="1" y2=".6">
          <stop stopColor="#b8c9b5" />
          <stop offset=".5" stopColor="#89a69b" />
          <stop offset="1" stopColor="#6e8d87" />
        </linearGradient>
        <linearGradient id={`${uid}-mushroom`} x2=".7" y2="1">
          <stop stopColor="#f3b58d" />
          <stop offset=".4" stopColor="#dc8e76" />
          <stop offset="1" stopColor="#ad675d" />
        </linearGradient>
        <linearGradient id={`${uid}-wood`} x2=".3" y2="1">
          <stop stopColor="#e0be83" />
          <stop offset="1" stopColor="#a77b50" />
        </linearGradient>
        <linearGradient id={`${uid}-tower`} x2="1">
          <stop stopColor="#fff2cd" />
          <stop offset=".6" stopColor="#e7d7ad" />
          <stop offset="1" stopColor="#b6b491" />
        </linearGradient>
        <radialGradient id={`${uid}-meadow-light`} cx=".3" cy=".25" r=".85">
          <stop stopColor="#fff8cc" stopOpacity=".5" />
          <stop offset="1" stopColor="#fff8cc" stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`${uid}-grass`}
          width="83"
          height="61"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M12 23l2 -4 2 4 M56 49l2 -5 3 4"
            stroke="#477658"
            opacity=".12"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="36" cy="12" r="1.5" fill="#fff5bf" opacity=".55" />
          <circle cx="76" cy="37" r="1" fill="#fffbe4" opacity=".6" />
        </pattern>
        <pattern
          id={`${uid}-ripples`}
          width="93"
          height="54"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M8 33q14 4 28 0 M62 12q9 3 18 0"
            stroke="#fffdf0"
            opacity=".37"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </pattern>
        <linearGradient
          id={`${uid}-river-fade`}
          x1="0"
          y1="0"
          x2="0"
          y2="430"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset=".12" stopColor="white" />
          <stop offset=".91" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask
          id={`${uid}-mouth`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="760"
          height="470"
        >
          <rect width="760" height="470" fill={paint("river-fade")} />
        </mask>
        <clipPath id={`${uid}-shore`}>
          <path d={land} />
        </clipPath>
      </defs>
      <rect
        className="landscape-water"
        width="760"
        height="470"
        fill={paint("water")}
      />
      <g
        className="ocean-contours"
        fill="none"
        stroke="#edf4e4"
        strokeLinecap="round"
      >
        <path
          d="M-20 353Q32 430 152 410T319 446T501 442T780 378"
          strokeWidth="2"
          opacity=".4"
        />
        <path
          d="M-20 371Q42 443 153 424T320 459T501 454T780 393"
          strokeWidth="1.5"
          opacity=".25"
        />
      </g>
      <rect
        className="landscape-ripples"
        width="760"
        height="470"
        fill={paint("ripples")}
      />
      <path d={land} transform="translate(0 17)" fill="#477e70" opacity=".16" />
      <path
        d={land}
        transform="translate(0 8)"
        fill="#77a081"
        stroke="#88ad88"
        strokeWidth="9"
      />
      <path d={land} fill={paint("land")} stroke="#e9e9b5" strokeWidth="9" />
      <g clipPath={paint("shore")}>
        <path
          d="M-20 170Q74 127 172 180T335 174T507 209T790 170V400H-20Z"
          fill="#9cc288"
          opacity=".3"
        />
        <path
          d="M-20 293Q84 238 168 294T330 286T480 319T790 271V440H-20Z"
          fill="#7eac79"
          opacity=".19"
        />
        <path
          d="M-20 79Q79 35 174 83T330 88T504 134T790 147"
          stroke="#f2f3c8"
          strokeWidth="5"
          opacity=".55"
          fill="none"
        />
        <rect width="760" height="470" fill={paint("grass")} />
        <rect width="760" height="470" fill={paint("meadow-light")} />
        <g opacity=".15" fill="#fff8c6" className="map-sunbeams">
          <path d="M528 -50L137 470H203L580 -50Z" />
          <path d="M590 -50L363 470H399L624 -50Z" />
          <path d="M676 -50L597 470H618L696 -50Z" />
        </g>
      </g>
      <g fill="#6d996d" opacity=".14">
        <ellipse cx="219" cy="106" rx="49" ry="14" />
        <ellipse cx="524" cy="306" rx="50" ry="18" />
        <ellipse cx="174" cy="354" rx="35" ry="13" />
      </g>
      <path
        d={trail}
        stroke="#b7ac77"
        strokeWidth="27"
        opacity=".35"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={trail}
        stroke="#f4e7bc"
        strokeWidth="22"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={trail}
        stroke="#cbb785"
        strokeWidth="1.6"
        strokeDasharray="2 10"
        fill="none"
        strokeLinecap="round"
      />
      <g mask={paint("mouth")}>
        <path
          d={river}
          stroke="#769b75"
          strokeWidth="36"
          opacity=".3"
          fill="none"
        />
        <path d={river} stroke="#d8dfb1" strokeWidth="31" fill="none" />
        <path d={river} stroke={paint("river")} strokeWidth="26" fill="none" />
        <path
          className="river-shimmer ambient-motion"
          d={river}
          stroke="#d6f0d8"
          strokeWidth="3"
          strokeDasharray="9 18"
          fill="none"
          opacity=".8"
        />
      </g>
      <g transform="translate(450 62)">
        <ellipse
          cx="59"
          cy="100"
          rx="66"
          ry="12"
          fill="#718e78"
          opacity=".18"
        />
        <path d="M0 99L47 5L103 99Z" fill={paint("mountain")} />
        <path d="M47 5L103 99H52Z" fill="#6a8e85" opacity=".5" />
        <path d="M24 52L47 5L75 54L57 45L47 56L37 43Z" fill={paint("snow")} />
        <path
          d="M37 59L25 85 M59 63L80 88"
          stroke="#b7cbb2"
          strokeWidth="2"
          opacity=".6"
        />
        <path d="M63 101L91 37L134 101Z" fill="#95b0a0" />
        <path d="M91 37L134 101H96Z" fill="#78998e" />
        <path d="M78 67L91 37L110 66L99 61L93 70L86 61Z" fill={paint("snow")} />
        <path d="M-17 101L7 51L34 101Z" fill="#a6bda5" />
        <path d="M0 66L7 51L16 68L10 64L6 70Z" fill="#f1f1d9" />
      </g>
      {trees.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <ellipse cy="28" cx="5" rx="24" ry="7" fill="#436c4a" opacity=".14" />
          <path d="M-4 10L-3 30Q1 32 5 29L3 10Z" fill="#9a7751" />
          <path d="M-1 14V28" stroke="#d2b17b" strokeWidth="2" />
          <g
            className="tree-canopy ambient-motion"
            style={{ animationDelay: `${i * -0.6}s` }}
          >
            <path
              d="M0 -43Q-8 -29 -19 -17L-13 -17Q-20 -5 -27 0L-18 1Q-26 13 -30 17Q0 30 30 17L18 1L27 0L13 -17L19 -17Q8 -29 0 -43Z"
              fill={paint("pine")}
            />
            <path
              d="M0 -41Q-6 -25 -16 -17L-8 -17Q-15 -4 -23 0L-11 1Q-15 11 -24 16Q-9 22 0 21Z"
              fill="#9ac28c"
              opacity=".3"
            />
            <path
              d="M-13 -14Q0 -9 15 -14 M-20 3Q0 11 22 3"
              stroke="#285f50"
              strokeWidth="2"
              opacity=".3"
              fill="none"
            />
            <path
              d="M-8 -25l3 -4 M-19 -1l4 -2 M-14 14l5 1"
              stroke="#c7db9d"
              strokeWidth="2"
              opacity=".6"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M-17 31l2 -7 3 6 M13 30l4 -6 1 6"
            stroke="#729b65"
            strokeWidth="2"
            fill="none"
          />
        </g>
      ))}
      {[
        [57, 178, 1],
        [215, 351, 0.7],
        [273, 126, 0.6],
        [491, 363, 0.8],
        [661, 228, 0.7],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <ellipse cy="12" rx="29" ry="8" fill="#567c53" opacity=".14" />
          <path
            d="M-28 7Q-30 -9 -17 -10Q-13 -30 3 -22Q20 -28 25 -11Q40 -6 29 10Z"
            fill="#87ad78"
          />
          <path
            d="M-26 0Q-25 -10 -14 -8Q-11 -27 4 -19Q19 -22 22 -9"
            fill="#bdd49a"
          />
          <circle cx="-9" cy="-8" r="2" fill="#ead999" />
          <circle cx="12" cy="-12" r="2" fill="#f7e5ae" />
        </g>
      ))}
      <g transform="translate(346 202) rotate(25)">
        <ellipse cx="25" cy="25" rx="32" ry="18" fill="#486f57" opacity=".2" />
        <rect x="-3" y="-2" width="54" height="36" rx="3" fill="#976c46" />
        <rect width="48" height="31" rx="2" fill={paint("wood")} />
        <path
          d="M7 0V31M17 0V31M28 0V31M39 0V31"
          stroke="#f1d29a"
          strokeWidth="2"
        />
        <path d="M0 3H48M0 28H48" stroke="#875e3e" strokeWidth="3" />
        <path
          d="M-2 -6V7 M15 -6V5 M33 -6V5 M50 -6V7 M-2 25V38 M15 28V38 M33 28V38 M50 25V38"
          stroke="#ac8051"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M-2 -5Q24 0 50 -5 M-2 37Q24 31 50 37"
          stroke="#e1bf83"
          strokeWidth="2"
          fill="none"
        />
      </g>
      <g transform="translate(261 319)">
        <ellipse cy="27" rx="32" ry="8" fill="#688658" opacity=".22" />
        <path d="M-7 3L-8 25Q1 31 10 24L7 2Z" fill={paint("snow")} />
        <path
          d="M-30 5Q-30 -18 -8 -30Q3 -37 17 -25Q32 -14 31 5Q0 17 -30 5Z"
          fill={paint("mushroom")}
        />
        <path
          d="M-27 6Q0 18 29 6"
          stroke="#f2c5a2"
          strokeWidth="3"
          fill="none"
        />
        <ellipse
          cx="-10"
          cy="-13"
          rx="6"
          ry="4"
          fill="#fff0cb"
          transform="rotate(-20)"
        />
        <ellipse cx="12" cy="-18" rx="5" ry="4" fill="#fff0cb" />
        <ellipse cx="18" cy="-4" rx="4" ry="3" fill="#fff0cb" />
        <path d="M-5 25V17Q1 10 6 17V25" fill="#c4b48c" />
        <path
          d="M-22 -7Q-15 -21 -4 -24"
          stroke="#ffcba4"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity=".7"
        />
      </g>
      <g transform="translate(294 341) scale(.65)">
        <ellipse cy="25" rx="25" ry="7" fill="#688658" opacity=".15" />
        <rect x="-5" width="11" height="25" rx="4" fill="#f4e4bd" />
        <path
          d="M-25 5Q-20 -27 0 -28Q23 -27 27 5Q0 15 -25 5Z"
          fill={paint("mushroom")}
        />
        <circle cx="-9" cy="-9" r="5" fill="#fff0cf" />
        <circle cx="12" cy="-15" r="5" fill="#fff0cf" />
      </g>
      <g transform="translate(688 264)">
        <ellipse cy="48" rx="37" ry="10" fill="#5e865e" opacity=".17" />
        <path d="M-24 42H25L19 49H-29Z" fill="#d6c39a" />
        <path d="M-18 40L-12 -25H13L20 40Z" fill={paint("tower")} />
        <path d="M-13 -7H15L16 4H-14Z M-16 19H18L19 29H-17Z" fill="#cc8d7c" />
        <path
          d="M-9 -26V-42Q1 -47 10 -42V-26Z"
          fill="#efd08c"
          stroke="#a49d74"
          strokeWidth="2"
        />
        <path d="M-14 -43L0 -56L16 -43Z" fill="#8b9d83" />
        <path d="M-16 -25H17M-17 -21H18" stroke="#7c9279" strokeWidth="2" />
        <path
          d="M-15 -28V-20M-6 -28V-20M5 -28V-20M16 -28V-20"
          stroke="#7c9279"
          strokeWidth="1.5"
        />
        <path d="M-5 40V30Q1 24 7 30V40" fill="#718b7a" />
        <path d="M2 -56V-73L21 -67L2 -62" fill="#dda97a" />
        <path
          d="M-8 -38L2 -40"
          stroke="#fff7d4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(712 333)">
        <ellipse cy="13" rx="19" ry="5" fill="#6b8f65" opacity=".18" />
        <path
          d="M-15 0Q-15 -15 0 -15Q15 -15 15 0V12H-15Z"
          fill={paint("wood")}
        />
        <path
          d="M-15 0H15M-9 -11V12M8 -11V12"
          stroke="#e7ce8d"
          strokeWidth="3"
        />
        <rect x="-3" y="-2" width="6" height="7" rx="1" fill="#f3da93" />
      </g>
      {[
        [69, 236],
        [224, 93],
        [461, 361],
        [622, 273],
        [174, 148],
        [525, 154],
        [114, 320],
        [205, 281],
        [502, 335],
        [725, 201],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 8V0M0 5L-4 2M0 5L4 1" stroke="#779960" strokeWidth="2" />
          <circle cy="-2" r="4" fill={i % 2 ? "#fff0b6" : "#efb199"} />
          <circle cy="-2" r="1.5" fill="#d6ad69" />
        </g>
      ))}
      <g className="landscape-clouds" fill="#fffdf0">
        <g className="drifting-cloud cloud-a ambient-motion">
          <path
            d="M30 24Q25 10 41 10Q45 -4 60 5Q74 -5 85 10Q101 8 103 24Z"
            opacity=".9"
          />
          <path d="M34 24H100" stroke="#f8edd0" strokeWidth="3" opacity=".6" />
        </g>
        <g className="drifting-cloud cloud-b ambient-motion">
          <path
            d="M584 38Q581 23 595 24Q602 8 617 21Q633 14 641 28Q654 25 658 38Z"
            opacity=".85"
          />
        </g>
      </g>
      <g
        className="map-birds ambient-motion"
        stroke="#668c7b"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M195 43q5 -6 10 0q5 -6 10 0M220 30q4 -5 8 0q4 -5 8 0" />
      </g>
      <g
        className="map-butterfly ambient-motion"
        transform="translate(420 365)"
      >
        <g className="butterfly-wings ambient-motion">
          <ellipse
            cx="-5"
            cy="-3"
            rx="6"
            ry="8"
            fill="#e4a96e"
            transform="rotate(-25)"
          />
          <ellipse
            cx="5"
            cy="-3"
            rx="6"
            ry="8"
            fill="#f1d6ac"
            transform="rotate(25)"
          />
        </g>
        <path d="M0 -6V7" stroke="#82694b" strokeWidth="2" />
      </g>
      <g
        className="landscape-stars ambient-motion"
        fill="#fff0b8"
        aria-hidden="true"
      >
        {[
          [125, 18],
          [275, 34],
          [448, 20],
          [697, 60],
          [542, 47],
          [356, 16],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 -5L1 -1L5 0L1 1L0 5L-1 1L-5 0L-1 -1Z" />
          </g>
        ))}
      </g>
    </svg>
  );
}
