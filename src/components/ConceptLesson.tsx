import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  RotateCcw,
  Volume2,
} from "lucide-react";
import type { Appearance } from "../lib/appearance";
import {
  answerFor,
  equationFor,
  gradeModel,
  initialModel,
  questionFor,
  type Lesson,
  type Example,
} from "../lib/lessons";
import { Companion } from "./Companion";
import {
  ArrayPicture,
  GroupsPicture,
  LessonModel,
  NumberLine,
} from "./LessonVisuals";
import { playPipVoice, stopPipVoice } from "../lib/pipVoice";
import { narrationKey, startRecordedNarration } from "../lib/narration";
import { narrationClips } from "../lib/narrationManifest";

const steps = [
  "Watch Pip",
  "Build together",
  "Try yourself",
  "Connect the idea",
];
export default function ConceptLesson({
  lesson,
  look,
  onBack,
  onFinish,
  onReturn,
  fromPractice,
}: {
  lesson: Lesson;
  look: Appearance;
  onBack: () => void;
  onFinish: (supported: boolean) => void;
  onReturn: () => void;
  fromPractice: boolean;
}) {
  const [step, setStep] = useState(0),
    [reveal, setReveal] = useState(0),
    [model, setModel] = useState(() => initialModel(lesson));
  const [checked, setChecked] = useState(false),
    [feedback, setFeedback] = useState("");
  const [quiz, setQuiz] = useState(0),
    [answer, setAnswer] = useState("");
  const [help, setHelp] = useState(false),
    [supported, setSupported] = useState(false),
    [reading, setReading] = useState(false),
    [audioMessage, setAudioMessage] = useState("");
  const finished = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const stopRecording = useRef<(() => void) | null>(null);
  const maxReveal =
    lesson.model === "sharing" ? lesson.example.each : lesson.example.groups;
  const checkExample = lesson.checks[quiz];
  const instruction =
    step === 0
      ? lesson.explanation
      : step === 1
        ? lesson.guided
        : step === 2
          ? questionFor(lesson, checkExample)
          : lesson.takeaway;
  function cancelReading() {
    stopRecording.current?.();
    stopRecording.current = null;
    utterance.current = null;
    window.speechSynthesis?.cancel();
    setReading(false);
  }
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "auto" });
    cancelReading();
    setAudioMessage("");
  }, [step, quiz]);
  useEffect(() => {
    if (look.voice === "off") cancelReading();
  }, [look.voice]);
  useEffect(
    () => () => {
      stopRecording.current?.();
      utterance.current = null;
      window.speechSynthesis?.cancel();
      stopPipVoice();
    },
    [],
  );
  function read() {
    if (reading) {
      cancelReading();
      return;
    }
    if (look.voice === "off") return;
    cancelReading();
    stopPipVoice();
    const text = `${lesson.title}. ${instruction}`;
    const clip = narrationClips[narrationKey(text)];
    if (clip) {
      setReading(true);
      setAudioMessage("Kokoro narrator · Heart");
      stopRecording.current = startRecordedNarration(
        clip,
        () => {
          stopRecording.current = null;
          setReading(false);
        },
        () => {
          stopRecording.current = null;
          deviceRead(text);
        },
      );
    } else deviceRead(text);
  }
  function deviceRead(text: string) {
    setReading(false);
    setAudioMessage("Using this device’s voice.");
    const synth = window.speechSynthesis,
      voice = synth
        ?.getVoices()
        .find((v) => v.localService && v.lang.startsWith("en"));
    if (!voice) {
      setAudioMessage(
        "No local English narration voice is ready. Follow the written explanation, or try again.",
      );
      return;
    }
    const speech = new SpeechSynthesisUtterance(text);
    utterance.current = speech;
    speech.voice = voice;
    speech.rate = 0.88;
    speech.volume = 0.65;
    speech.onend = () => {
      if (utterance.current === speech) setReading(false);
    };
    speech.onerror = () => {
      if (utterance.current === speech) {
        setReading(false);
        setAudioMessage(
          "Narration stopped. The written lesson is ready whenever you are.",
        );
      }
    };
    setReading(true);
    synth.speak(speech);
  }
  function reset() {
    cancelReading();
    setStep(0);
    setReveal(0);
    setModel(initialModel(lesson));
    setChecked(false);
    setFeedback("");
    setQuiz(0);
    setAnswer("");
    setHelp(false);
    setSupported(false);
    finished.current = false;
  }
  function next() {
    if (
      (step === 0 && reveal < maxReveal) ||
      (step > 0 && step < 3 && !checked)
    )
      return;
    if (step === 2 && quiz === 0) {
      setQuiz(1);
      setAnswer("");
      setChecked(false);
      setFeedback("");
      setHelp(false);
      return;
    }
    if (step === 2 && !finished.current) {
      finished.current = true;
      onFinish(supported);
    }
    setStep((s) => s + 1);
    setChecked(false);
    setFeedback("");
    setHelp(false);
  }
  const example = lesson.example;
  function picture(e: Example) {
    return lesson.model === "jumps" ? (
      <NumberLine
        groups={e.groups}
        each={e.each}
        jumps={Array.from({ length: e.groups + 1 }, (_, i) => i * e.each)}
        disabled
      />
    ) : lesson.model === "array" || lesson.model === "division-array" ? (
      <ArrayPicture example={e} />
    ) : (
      <GroupsPicture example={e} />
    );
  }
  const watch =
    lesson.model === "jumps" ? (
      <NumberLine
        groups={example.groups}
        each={example.each}
        jumps={Array.from({ length: reveal + 1 }, (_, i) => i * example.each)}
        disabled
      />
    ) : lesson.model === "sharing" ? (
      <GroupsPicture example={{ groups: example.groups, each: reveal }} />
    ) : lesson.model === "array" || lesson.model === "division-array" ? (
      reveal > 0 ? (
        <ArrayPicture example={{ groups: reveal, each: example.each }} />
      ) : (
        <p className="concept-callout">Let’s reveal the rows, one at a time.</p>
      )
    ) : (
      <GroupsPicture example={example} revealed={reveal} />
    );
  return (
    <>
      <div className="lesson-topbar">
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to {lesson.subject} concepts
        </button>
        <span>{lesson.title} · No timer</span>
        <button className="secondary" onClick={reset}>
          <RotateCcw size={16} />
          Replay this lesson
        </button>
      </div>
      <ol className="lesson-steps" aria-label="Lesson steps">
        {steps.map((name, i) => (
          <li key={name} aria-current={step === i ? "step" : undefined}>
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <div className="lesson-workspace">
        <aside className="lesson-pip">
          <Companion
            key={`${step}-${checked}`}
            look={look}
            celebrate={checked || step === 3}
            label="Say hello to learning Pip"
          />
          <p className="lesson-pip-note">
            {step === 3
              ? "You connected the idea. Come back whenever you want to explore it again."
              : checked
                ? "You explained it with a model. That’s mathematical thinking!"
                : "Take your time. You can change the model and try another way."}
          </p>
        </aside>
        <div className="lesson-content">
          <div className="eyebrow">
            {lesson.subject} · {steps[step]}
            {step === 2 ? ` · ${quiz + 1} of 2` : ""}
          </div>
          <h1 ref={heading} tabIndex={-1}>
            {lesson.title}
          </h1>
          <p className="lesson-instruction">{instruction}</p>
          <div className="lesson-sound">
            <button
              className="secondary"
              onClick={read}
              disabled={look.voice === "off"}
            >
              <Volume2 size={16} />
              {reading ? "Stop reading" : "Read aloud"}
            </button>
            {look.voice === "off" && (
              <small>Sound is muted in the header.</small>
            )}
            {audioMessage && <small role="status">{audioMessage}</small>}
          </div>
          {step === 0 && (
            <>
              {watch}
              <div className="lesson-equation" aria-live="polite">
                {lesson.model === "sharing"
                  ? `${example.groups * example.each - example.groups * reveal} left to share · ${reveal} on each blanket`
                  : lesson.model === "addition"
                    ? reveal
                      ? `${Array(reveal).fill(example.each).join(" + ")} = ${reveal * example.each}`
                      : "One equal group contributes one addend."
                    : lesson.model === "packing"
                      ? `${reveal} baskets filled · ${example.groups * example.each - reveal * example.each} berries left`
                      : lesson.model === "equation"
                        ? reveal === 0
                          ? "Every quantity has a job."
                          : reveal === 1
                            ? `Total: ${example.groups * example.each}`
                            : reveal === 2
                              ? `Groups: ${example.groups}`
                              : `In each: ${example.each}`
                        : lesson.model === "division-array"
                          ? `${reveal} of ${example.groups} rows · ${reveal * example.each} of ${example.groups * example.each} berries`
                          : lesson.model === "jumps"
                            ? `${reveal} jumps × ${example.each} = ${reveal * example.each}`
                            : `${reveal} ${lesson.model === "array" ? "rows" : "groups"} × ${example.each} = ${reveal * example.each}`}
              </div>
              <button
                className="primary"
                disabled={reveal === maxReveal}
                onClick={() => {
                  setReveal((n) => n + 1);
                  void playPipVoice(look.voice, "pop", reveal);
                }}
              >
                {lesson.model === "sharing"
                  ? "Share one to each blanket"
                  : lesson.model === "jumps"
                    ? `Jump ${example.each}`
                    : lesson.model === "array" ||
                        lesson.model === "division-array"
                      ? "Reveal the next row"
                      : lesson.model === "packing"
                        ? `Pack a basket of ${example.each}`
                        : lesson.model === "equation"
                          ? "Name the next quantity"
                          : "Reveal the next group"}
                <ArrowRight size={16} />
              </button>
            </>
          )}
          {step === 1 && (
            <>
              <LessonModel
                lesson={lesson}
                state={model}
                locked={checked}
                message={setFeedback}
                onChange={(nextModel) => {
                  setModel(nextModel);
                  setFeedback("");
                }}
              />
              <div className="lesson-control-row">
                <button
                  className="primary"
                  disabled={checked}
                  onClick={() => {
                    const result = gradeModel(lesson, model);
                    setChecked(result.correct);
                    setFeedback(result.message);
                    if (result.correct) void playPipVoice(look.voice, "chirp");
                  }}
                >
                  Check my model
                  <Check size={16} />
                </button>
                <button
                  className="secondary"
                  disabled={checked}
                  onClick={() => {
                    setModel(initialModel(lesson));
                    setFeedback("");
                  }}
                >
                  Reset my model
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="lesson-equation">
                {equationFor(lesson, checkExample)} = ?
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (checked || !/^\d{1,3}$/.test(answer.trim())) return;
                  const correct =
                    Number(answer) === answerFor(lesson, checkExample);
                  setChecked(correct);
                  if (correct) {
                    setFeedback(
                      `${equationFor(lesson, checkExample)} = ${answer}. ${lesson.model === "packing" ? "The answer counts baskets." : lesson.subject === "division" ? "The answer tells us how many are in each group." : "The answer counts all the berries."}`,
                    );
                    void playPipVoice(look.voice, "chirp");
                  } else {
                    setSupported(true);
                    setFeedback(
                      "A good try. Look at what the question is asking: the total, the number of groups, or the amount in each? You can open a visual explanation and try again.",
                    );
                  }
                }}
              >
                <label htmlFor="concept-answer">
                  {lesson.model === "packing"
                    ? "How many full baskets?"
                    : lesson.subject === "division"
                      ? "How many in each group?"
                      : "What is the total?"}
                </label>
                <div className="lesson-answer-row">
                  <input
                    id="concept-answer"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={3}
                    placeholder="Your answer"
                    disabled={checked}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  <button
                    className="primary"
                    disabled={checked || !/^\d{1,3}$/.test(answer.trim())}
                  >
                    Check my thinking
                  </button>
                </div>
              </form>
              <button
                className="lesson-another"
                onClick={() => {
                  if (!checked) setSupported(true);
                  setHelp((v) => !v);
                }}
              >
                <Lightbulb size={16} />
                {help ? "Hide the explanation" : "Explain another way"}
              </button>
              {help && (
                <>
                  {picture(checkExample)}
                  <p className="concept-callout">
                    {lesson.model === "packing"
                      ? `The ${checkExample.groups * checkExample.each} berries make ${checkExample.groups} full groups of ${checkExample.each}. Count the groups, not the berries in one group.`
                      : lesson.subject === "division"
                        ? `There are ${checkExample.groups} equal groups of ${checkExample.each}. Check by multiplying ${checkExample.groups} × ${checkExample.each} = ${checkExample.groups * checkExample.each}.`
                        : `Count each equal group once: ${Array(checkExample.groups).fill(checkExample.each).join(" + ")} = ${checkExample.groups * checkExample.each}.`}
                  </p>
                </>
              )}
            </>
          )}
          {step === 3 && (
            <>
              {picture(example)}
              <div className="lesson-equation">
                {equationFor(lesson, example)} = {answerFor(lesson, example)}
              </div>
              <p className="concept-callout">{lesson.takeaway}</p>
              <p className="fine-print">
                {supported
                  ? "You practiced this concept with support. That is part of learning."
                  : "You checked two examples independently in this exploration."}{" "}
                This is an observation, not a mastery score.
              </p>
              <div className="lesson-control-row">
                <button className="primary" onClick={onBack}>
                  Choose another concept
                  <ArrowRight size={16} />
                </button>
                <button className="secondary" onClick={onReturn}>
                  {fromPractice
                    ? "Back to my question"
                    : "Back to my adventure"}
                </button>
              </div>
            </>
          )}
          {feedback && (
            <div
              role="status"
              className={`lesson-feedback ${checked ? "understood" : "try-again"}`}
            >
              {feedback}
            </div>
          )}
          {step < 3 && (
            <div className="lesson-next">
              <small>
                {step === 0
                  ? "Reveal the whole model before moving on."
                  : checked
                    ? "Ready when you are."
                    : "Experiment, then check your thinking."}
              </small>
              <button
                className="primary"
                disabled={step === 0 ? reveal < maxReveal : !checked}
                onClick={next}
              >
                {step === 2
                  ? quiz === 0
                    ? "One more to try"
                    : "Connect the idea"
                  : "Keep exploring"}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
