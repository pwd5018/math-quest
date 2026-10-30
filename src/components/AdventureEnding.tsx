import type { Skill } from "../lib/math";
import type { Attempt } from "../lib/learning";
import type { Appearance } from "../lib/appearance";
import { adventureHighlights } from "../lib/practiceTools";
import { Companion } from "./Companion";

const endings: Record<Skill, { title: string; story: string; quote: string }> =
  {
    addition: {
      title: "A picnic in Sunshine Meadow",
      story:
        "At the end of the trail, Pip spreads a picnic blanket beneath the flowers. There’s a little time to rest and enjoy the view.",
      quote: "One little discovery at a time. Look how far we traveled!",
    },
    subtraction: {
      title: "Lanterns in Mushroom Grove",
      story:
        "Pip reaches a cozy mushroom cottage as the woodland lanterns glow. A warm welcome waits at the end of the path.",
      quote: "Every time we tried another way, we took another step.",
    },
    multiplication: {
      title: "A view from Mountain Peaks",
      story:
        "Pip settles beside the trail flag. Beyond the snowy peaks, the whole valley shines. What a lovely place to pause after an adventure.",
      quote: "Big mountains are climbed in little steps. We kept going!",
    },
    division: {
      title: "A gathering at Treasure Cove",
      story:
        "Back at the cove, Pip and friends settle beside the lighthouse. They gather around a basket of sparkling gems as the waves roll in.",
      quote: "There’s room for everyone on our next adventure.",
    },
  };

export default function AdventureEnding({
  skill,
  look,
  attempts,
  sessionId,
  independent,
}: {
  skill: Skill;
  look: Appearance;
  attempts: Attempt[];
  sessionId: string;
  independent: number;
}) {
  const ending = endings[skill];
  const highlights = adventureHighlights(attempts, sessionId);
  return (
    <>
      <div className={`ending-scene ending-scene-${skill}`}>
        <svg
          viewBox="0 0 640 210"
          aria-hidden="true"
          preserveAspectRatio="xMidYMax meet"
        >
          <circle cx="520" cy="43" r="26" fill="#fff2b9" />
          <path d="M0 165Q140 50 320 145T640 110V210H0Z" fill="#b6cba3" />
          {skill === "multiplication" ? (
            <>
              <path
                d="M40 190L180 24L320 190M280 190L430 12L590 190"
                fill="#91b4b9"
              />
              <path
                d="M138 74L180 24L222 74L181 61ZM385 64L430 12L479 67L435 50Z"
                fill="#fff9e9"
              />
              <path
                d="M483 150V62L535 79L483 95"
                fill="#d99678"
                stroke="#647e6c"
                strokeWidth="4"
              />
            </>
          ) : skill === "subtraction" ? (
            <>
              <path d="M100 165V98H165V165" fill="#f7e5b4" />
              <path d="M69 99Q130 -1 196 99Z" fill="#cf8d76" />
              <circle cx="132" cy="124" r="13" fill="#ffe39c" />
              <path
                d="M440 150V58M530 157V73M440 61Q485 95 530 76"
                fill="none"
                stroke="#718269"
                strokeWidth="4"
              />
              <circle cx="465" cy="76" r="9" fill="#ffe39c" />
              <circle cx="505" cy="81" r="9" fill="#ffe39c" />
            </>
          ) : skill === "division" ? (
            <>
              <path d="M0 158Q160 130 320 163T640 147V210H0Z" fill="#90bec0" />
              <path d="M465 150L475 51H507L517 150Z" fill="#fff4d9" />
              <path d="M468 51L491 30L514 51Z" fill="#c58e7f" />
              <path
                d="M477 72H505M473 104H509"
                stroke="#c58e7f"
                strokeWidth="12"
              />
              <path
                d="M60 181Q100 170 140 181M385 189Q425 178 465 189"
                fill="none"
                stroke="#e5f2e8"
                strokeWidth="3"
              />
            </>
          ) : (
            <>
              <path d="M110 165L145 123L225 141L196 184Z" fill="#e3a494" />
              <path
                d="M465 158V106M508 159V117M548 168V112"
                stroke="#72916c"
                strokeWidth="4"
              />
              {[465, 508, 548].map((x, i) => (
                <g key={x}>
                  <circle cx={x} cy={106 + i * 4} r="13" fill="#efd9a3" />
                  <circle cx={x} cy={106 + i * 4} r="5" fill="#b28a66" />
                </g>
              ))}
            </>
          )}
          <path d="M0 206Q170 160 320 192T640 190V210H0Z" fill="#7c9e7b" />
        </svg>
        <Companion
          look={look}
          celebrate
          label="Celebrate this adventure with Pip"
        />
      </div>
      <div className="ending-story">
        <div className="eyebrow">A MOMENT WITH PIP</div>
        <h2>{ending.title}</h2>
        <p>{ending.story}</p>
        <blockquote>
          “{ending.quote}” <span>— Pip</span>
        </blockquote>
      </div>
      <div
        className="adventure-highlights"
        aria-label="Your adventure highlights"
      >
        <h3>Your discoveries</h3>
        <ul>
          <li>
            {independent
              ? `${independent} ${independent === 1 ? "answer" : "answers"} worked out independently.`
              : "You finished the trail with support. Asking for help is part of learning."}
          </li>
          {highlights.reviewed > 0 && (
            <li>
              You solved {highlights.reviewed}{" "}
              {highlights.reviewed === 1
                ? "review question"
                : "review questions"}{" "}
              independently.
            </li>
          )}
          {highlights.retried > 0 ? (
            <li>
              You tried again and worked out {highlights.retried}{" "}
              {highlights.retried === 1 ? "question" : "questions"} after a
              mistake.
            </li>
          ) : (
            highlights.supported > 0 && (
              <li>
                You used support to work out {highlights.supported}{" "}
                {highlights.supported === 1 ? "question" : "questions"}.
              </li>
            )
          )}
        </ul>
        {highlights.discoveries.length > 0 && (
          <div
            className="discovery-facts"
            aria-label="Some facts you solved independently"
          >
            {highlights.discoveries.map((q) => (
              <span key={q.id}>
                {q.a} {q.symbol} {q.b} = {q.answer}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
