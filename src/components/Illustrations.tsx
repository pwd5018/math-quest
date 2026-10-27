import { useId } from "react";

export function RewardArtwork({ symbol = "🎁" }: { symbol?: string }) {
  const id = useId().replace(/:/g, "");
  const fill = (name: string) => `url(#${id}-${name})`;
  const kind =
    symbol === "🍿"
      ? "movie"
      : symbol === "🧺"
        ? "picnic"
        : symbol === "🎲"
          ? "game"
          : "gift";
  return (
    <svg
      className={`reward-artwork reward-artwork-${kind}`}
      viewBox="0 0 240 180"
      role="img"
      aria-label={`${kind === "movie" ? "Popcorn for movie night" : kind === "picnic" ? "A woven picnic basket" : kind === "game" ? "Colorful game dice" : "A wrapped family treasure"} illustration`}
    >
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor="#fff6ce" />
          <stop offset="1" stopColor="#fff6ce" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x2=".8" y2="1">
          <stop stopColor="#f4d596" />
          <stop offset="1" stopColor="#b58046" />
        </linearGradient>
        <linearGradient id={`${id}-red`} x2=".5" y2="1">
          <stop stopColor="#e69d8c" />
          <stop offset="1" stopColor="#bd6371" />
        </linearGradient>
        <linearGradient id={`${id}-cream`} x2=".6" y2="1">
          <stop stopColor="#fffde7" />
          <stop offset="1" stopColor="#e4cfa5" />
        </linearGradient>
        <linearGradient id={`${id}-green`} x2=".6" y2="1">
          <stop stopColor="#b4d0ae" />
          <stop offset="1" stopColor="#568b77" />
        </linearGradient>
        <linearGradient id={`${id}-purple`} x2=".8" y2="1">
          <stop stopColor="#c3b1da" />
          <stop offset="1" stopColor="#8475a9" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="88" rx="100" ry="82" fill={fill("halo")} />
      <ellipse cx="122" cy="154" rx="62" ry="10" fill="#667e6b" opacity=".15" />
      <g className="reward-object ambient-motion">
        {kind === "movie" && (
          <>
            <path
              d="M77 68H165L153 147Q121 160 89 147Z"
              fill={fill("red")}
              stroke="#b67871"
              strokeWidth="2"
            />
            <path
              d="M89 75L96 148L109 151L105 75 M124 75V153L139 151L143 75"
              fill={fill("cream")}
            />
            <path
              d="M82 75Q120 86 160 75"
              stroke="#fff8dc"
              strokeWidth="3"
              fill="none"
            />
            {[
              [83, 65, 13],
              [102, 48, 14],
              [120, 60, 15],
              [139, 45, 14],
              [155, 64, 14],
              [116, 34, 13],
              [94, 66, 12],
              [137, 68, 13],
            ].map(([x, y, r], i) => (
              <g key={i}>
                <path
                  d={`M${x - r} ${y}q-4 -12 7 -13q2 -11 12 -4q13 -3 13 9q8 10 -6 17q-7 8 -14 -1q-12 4 -12 -8Z`}
                  fill={fill("cream")}
                />
                <path
                  d={`M${x} ${y}q5 -7 10 -2`}
                  stroke="#e4bf78"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ))}
            <path
              d="M88 92L92 131"
              stroke="#fff6e6"
              strokeWidth="3"
              strokeLinecap="round"
              opacity=".55"
            />
          </>
        )}
        {kind === "picnic" && (
          <>
            <path
              d="M91 94Q69 26 121 28Q171 26 150 94"
              fill="none"
              stroke="#ac7949"
              strokeWidth="10"
            />
            <path
              d="M92 83Q80 35 121 35Q161 35 150 83"
              fill="none"
              stroke="#e7c18c"
              strokeWidth="4"
            />
            <path
              d="M74 88L86 145Q121 161 157 145L169 88Z"
              fill={fill("gold")}
              stroke="#b6844f"
              strokeWidth="2"
            />
            <path
              d="M79 101H165 M82 115H162 M85 129H159 M89 142H155"
              stroke="#b8844e"
              strokeWidth="3"
              opacity=".6"
            />
            {[94, 108, 122, 136, 150].map((x) => (
              <path
                key={x}
                d={`M${x} 95V148`}
                stroke="#f3d7a7"
                strokeWidth="3"
                opacity=".6"
              />
            ))}
            <path
              d="M71 84Q121 96 171 84L170 96Q121 109 72 96Z"
              fill="#d5aa70"
              stroke="#b5834d"
              strokeWidth="2"
            />
            <path
              d="M83 82L104 61L135 80L153 64L165 85Q124 95 83 82Z"
              fill="#f3e2bd"
            />
            <path
              d="M104 63L135 82 M97 70L127 87 M113 63L143 80"
              stroke="#c9877e"
              strokeWidth="4"
            />
            <ellipse cx="89" cy="78" rx="12" ry="15" fill={fill("green")} />
            <path
              d="M88 64Q88 53 99 54"
              stroke="#78925c"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M144 74Q137 47 151 42Q169 39 164 79Z"
              fill={fill("cream")}
            />
            <path
              d="M150 53L160 55 M149 63L160 65"
              stroke="#d0ac70"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        )}
        {kind === "game" && (
          <>
            <g transform="translate(61 64) rotate(-14 43 40)">
              <path d="M7 10L64 0L84 20L27 31Z" fill="#dde9ca" />
              <path d="M27 31L84 20V84L27 94Z" fill="#5f927f" />
              <path d="M7 10L27 31V94L7 73Z" fill="#7eaa91" />
              <path d="M30 36L80 27V80L30 89Z" fill={fill("green")} />
              {[
                [43, 48],
                [67, 43],
                [43, 73],
                [67, 68],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="5" fill="#fffbe4" />
              ))}
              <path d="M11 25L22 35V73L11 63Z" fill="#bbd5ac" opacity=".5" />
            </g>
            <g transform="translate(112 88) rotate(12 35 30)">
              <path d="M0 0L52 -10L70 7L18 18Z" fill="#e5d8ed" />
              <path d="M18 18L70 7V61L18 73Z" fill="#8475a9" />
              <path d="M0 0L18 18V73L0 55Z" fill="#a391c1" />
              <path d="M22 22L66 13V57L22 67Z" fill={fill("purple")} />
              {[
                [32, 31],
                [55, 27],
                [44, 43],
                [32, 58],
                [55, 53],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="#fff7dc" />
              ))}
            </g>
          </>
        )}
        {kind === "gift" && (
          <>
            <path
              d="M74 82H165V145Q120 160 74 145Z"
              fill={fill("green")}
              stroke="#698e75"
              strokeWidth="2"
            />
            <path d="M68 75Q118 66 170 75V91Q121 101 68 91Z" fill="#a7c0a0" />
            <path d="M111 75H129V154H111Z" fill={fill("gold")} />
            <path
              d="M119 75Q77 69 88 47Q101 32 120 72Q129 28 149 47Q161 68 120 75Z"
              fill="none"
              stroke="#e3bf82"
              strokeWidth="8"
            />
            <circle
              cx="121"
              cy="117"
              r="22"
              fill="#f5efd4"
              stroke="#d0b77d"
              strokeWidth="3"
            />
            <text x="121" y="125" textAnchor="middle" fontSize="23">
              {symbol}
            </text>
          </>
        )}
      </g>
      <g className="reward-art-sparkles ambient-motion" fill="#ceb26c">
        <path d="M44 43l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" />
        <path d="M192 95l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
        <circle cx="181" cy="38" r="3" />
        <circle cx="58" cy="127" r="2" />
      </g>
    </svg>
  );
}

export function SkillMedal({
  symbol,
  unlocked = false,
}: {
  symbol: string;
  unlocked?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`skill-medal-art ${unlocked ? "earned" : ""}`}
      viewBox="0 0 120 135"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-metal`} x2=".7" y2="1">
          <stop stopColor={unlocked ? "#fff0b6" : "#e1e8dc"} />
          <stop offset=".45" stopColor={unlocked ? "#dbb464" : "#bdcdb9"} />
          <stop offset="1" stopColor={unlocked ? "#ad834a" : "#95ad98"} />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx=".35" cy=".25">
          <stop stopColor={unlocked ? "#fff4ca" : "#f1f4e9"} />
          <stop offset="1" stopColor={unlocked ? "#e4bd6e" : "#c4d4bc"} />
        </radialGradient>
      </defs>
      <path
        d="M29 84L19 126L40 117L53 132L62 88 M65 88L73 132L86 117L108 126L95 83Z"
        fill={unlocked ? "#85a889" : "#b3c7b3"}
      />
      <path
        d="M34 87L26 113L41 108L49 119L56 91 M72 91L78 119L86 108L100 113L91 87Z"
        fill={unlocked ? "#bed4a4" : "#cfdbca"}
      />
      <circle cx="62" cy="59" r="48" fill="#527350" opacity=".12" />
      <circle cx="60" cy="55" r="47" fill={`url(#${id}-metal)`} />
      <circle
        cx="60"
        cy="55"
        r="40"
        fill="none"
        stroke={unlocked ? "#fff0b4" : "#eef3e5"}
        strokeWidth="2"
      />
      <circle cx="60" cy="55" r="34" fill={`url(#${id}-face)`} />
      <path
        d="M28 43Q35 19 62 20"
        stroke="#fffbea"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity=".65"
      />
      <path
        d="M35 76Q20 57 34 41 M85 76Q100 57 86 41"
        stroke={unlocked ? "#b58d4d" : "#93ac8f"}
        strokeWidth="3"
        fill="none"
      />
      <text
        x="60"
        y="69"
        textAnchor="middle"
        fontSize="41"
        fontWeight="700"
        fill={unlocked ? "#916c37" : "#789875"}
      >
        {symbol}
      </text>
      <path d="m60 84 2 5 6 1-4 4 1 6-5-3-5 3 1-6-4-4 6-1Z" fill="#fff2bf" />
    </svg>
  );
}

export function Atmosphere({ className = "" }: { className?: string }) {
  return (
    <div className={`scene-atmosphere ${className}`} aria-hidden="true">
      {[8, 19, 31, 44, 58, 72, 86, 94].map((x, i) => (
        <span
          key={x}
          className="scene-mote ambient-motion"
          style={{
            left: `${x}%`,
            top: `${[73, 29, 87, 46, 18, 64, 36, 81][i]}%`,
            animationDelay: `${i * -0.9}s`,
            animationDuration: `${7 + (i % 4)}s`,
          }}
        />
      ))}
      <div className="scene-lightwash" />
      <div className="scene-vignette" />
    </div>
  );
}
