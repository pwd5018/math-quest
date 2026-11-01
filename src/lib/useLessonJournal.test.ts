import { describe, expect, it } from "vitest";
import { restorePending } from "./useLessonJournal";

describe("durable learning-note queue", () => {
  it("retains valid operation identities and discards damaged entries", () => {
    const valid = {
      id: "original-operation",
      lesson: "equal-groups",
      kind: "independent",
    };
    expect(
      restorePending([
        null,
        valid,
        {},
        { ...valid, lesson: "unknown" },
        { ...valid, id: "bad/path" },
        { ...valid, kind: "coins" },
      ]),
    ).toEqual([valid]);
    expect(restorePending("broken")).toEqual([]);
  });
  it("bounds restored queues without regenerating operation identities", () => {
    const queue = Array.from({ length: 1001 }, (_, i) => ({
      id: `event-${i}`,
      lesson: "equal-sharing",
      kind: "explored",
    }));
    const restored = restorePending(queue);
    expect(restored).toHaveLength(1000);
    expect(restorePending(JSON.parse(JSON.stringify(restored)))).toEqual(
      restored,
    );
  });
});
