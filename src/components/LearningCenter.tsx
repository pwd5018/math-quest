import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import type { Appearance } from "../lib/appearance";
import {
  lessons,
  lessonById,
  observeLesson,
  restoreJournal,
  type Subject,
  type LessonJournal,
  type LessonObservation,
} from "../lib/lessons";
import { restoreConceptNote } from "../lib/concepts";
import { Companion } from "./Companion";
import { Berry } from "./LessonVisuals";
import ConceptLesson from "./ConceptLesson";
import "../learning-center.css";

export default function LearningCenter({
  look,
  fromPractice,
  storageScope,
  onReturn,
  initialSubject = "multiplication",
}: {
  look: Appearance;
  fromPractice: boolean;
  storageScope: string;
  onReturn: () => void;
  initialSubject?: Subject;
}) {
  const key = "math-quest-lessons-v2:" + storageScope;
  const [journal, setJournal] = useState<LessonJournal>(() => {
    try {
      return restoreJournal(JSON.parse(localStorage.getItem(key) || "null"));
    } catch {
      return {};
    }
  });
  const [legacy] = useState(() => {
    try {
      return restoreConceptNote(
        JSON.parse(
          localStorage.getItem("math-quest-concepts-v1:" + storageScope) ||
            "null",
        ),
      );
    } catch {
      return restoreConceptNote(null);
    }
  });
  const [subject, setSubject] = useState<Subject>(initialSubject),
    [active, setActive] = useState<string | null>(null),
    [warning, setWarning] = useState("");
  const selected = active ? lessonById(active) : undefined;
  function record(id: string, kind: keyof LessonObservation) {
    const next = observeLesson(journal, id, kind);
    setJournal(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setWarning("");
    } catch {
      setWarning(
        "Learning notes couldn’t be saved. You can still explore every lesson.",
      );
    }
  }
  function launch(id: string) {
    record(id, "explored");
    setActive(id);
  }
  return (
    <section className="learning-center">
      {fromPractice && (
        <div className="lesson-practice-return">
          <button className="secondary" onClick={onReturn}>
            <ArrowLeft size={16} />
            Back to my question
          </button>
          <small>
            Your question is waiting. Learning help has been recorded.
          </small>
        </div>
      )}
      {selected ? (
        <ConceptLesson
          key={selected.id}
          lesson={selected}
          look={look}
          fromPractice={fromPractice}
          onBack={() => setActive(null)}
          onReturn={onReturn}
          onFinish={(supported) =>
            record(selected.id, supported ? "supported" : "independent")
          }
        />
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">ONE IDEA AT A TIME</div>
              <h1>Learn with Pip</h1>
              <p>
                Choose a subject. Explore a concept. Make sense of the math.
              </p>
            </div>
          </div>
          <div className="lesson-subjects" aria-label="Learning subjects">
            {(["multiplication", "division"] as Subject[]).map((id) => (
              <button
                key={id}
                aria-pressed={subject === id}
                onClick={() => setSubject(id)}
              >
                <span aria-hidden="true">
                  {id === "multiplication" ? "×" : "÷"}
                </span>
                <strong>
                  {id === "multiplication" ? "Multiplication" : "Division"}
                </strong>
                <small>
                  {id === "multiplication"
                    ? "Equal groups → totals"
                    : "Totals → equal groups"}
                </small>
              </button>
            ))}
          </div>
          <div className="subject-intro">
            <Companion look={look} label="Say hello to your learning buddy" />
            <div>
              <span className="eyebrow">FOUR CONCEPTS TO EXPLORE</span>
              <h2>
                {subject === "multiplication"
                  ? "Multiplication learning"
                  : "Division learning"}
              </h2>
              <p>
                {subject === "multiplication"
                  ? "Start with equal groups, then connect addition, jumps and arrays. Each lesson teaches a different way to see the total."
                  : "Sharing among a known number of groups and making groups of a known size ask different questions. Explore both, then connect equations and arrays."}
              </p>
            </div>
          </div>
          <div className="concept-card-grid">
            {lessons
              .filter((l) => l.subject === subject)
              .map((lesson, i) => {
                const note = journal[lesson.id];
                return (
                  <article className="concept-card" key={lesson.id}>
                    <div className="concept-card-top">
                      <span className="concept-order">0{i + 1}</span>
                      <span className="concept-model-icon" aria-hidden="true">
                        {lesson.model === "jumps" ? (
                          "0 → 4 → 8"
                        ) : lesson.model === "addition" ? (
                          "4 + 4 + 4"
                        ) : lesson.model === "equation" ? (
                          "12 ÷ 3 = 4"
                        ) : lesson.model.includes("array") ? (
                          "▦"
                        ) : (
                          <>
                            <Berry />
                            <Berry />
                            <Berry />
                          </>
                        )}
                      </span>
                    </div>
                    <h3>{lesson.title}</h3>
                    <p>{lesson.description}</p>
                    <div className="concept-observations">
                      {note?.explored ? (
                        <span>
                          Explored {note.explored}{" "}
                          {note.explored === 1 ? "time" : "times"}
                        </span>
                      ) : (
                        <span>Ready to explore</span>
                      )}
                      {!!note?.supported && (
                        <span>Practiced with help · {note.supported}</span>
                      )}
                      {!!note?.independent && (
                        <span>Checked independently · {note.independent}</span>
                      )}
                    </div>
                    <button
                      className="primary"
                      onClick={() => launch(lesson.id)}
                    >
                      {note?.explored
                        ? "Explore again"
                        : "Explore this concept"}
                      <ArrowRight size={16} />
                    </button>
                  </article>
                );
              })}
          </div>
          <div className="lesson-notes">
            <BookOpen size={22} />
            <div>
              <h2>Learning notes, one concept at a time</h2>
              <p>
                Exploring, practicing with help and checking independently are
                separate observations. One successful check does not mark a
                whole concept as mastered.
              </p>
              <small>
                Saved on this device for this profile. These notes don’t award
                coins, change practice mastery or sync to other devices.
              </small>
              {legacy.completed > 0 && (
                <details className="legacy-concept-notes">
                  <summary>Earlier combined picnic notes</summary>
                  <p>
                    {legacy.completed} completed{" "}
                    {legacy.completed === 1 ? "exploration" : "explorations"}.
                    Multiplication: {legacy.multiplication}. Sharing:{" "}
                    {legacy.sharing}. These earlier notes remain separate from
                    the new concept lessons.
                  </p>
                </details>
              )}
            </div>
          </div>
        </>
      )}
      {warning && (
        <p role="status" className="lesson-feedback">
          {warning}
        </p>
      )}
      <p className="lesson-footer">
        No timer, coins or penalties. Choose any concept and replay it whenever
        you like.
      </p>
    </section>
  );
}
