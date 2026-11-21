/**
 * @file Collection leaves: one cell for a leaf under a collection, judged
 * against the corpus's ordinal-keyed expectation.
 *
 * The corpus format addresses a collection leaf once, at its element-relative
 * path, and spells a list-valued expectation as an object whose keys are the
 * instance ordinals. The suites here pin the rule that follows: the produced
 * instances are compared element-wise, in order, and a run that produced extra
 * instances is wrong.
 */
import { z } from "zod";
import { expect, test } from "vitest";

import { scoreEvalOverSchema } from "./score.js";
import type { ScoreCase } from "./score.js";
import { envelope, extracted } from "./test-support/score.js";
import type { EvalJsonValue } from "./types.js";

/** The schema under test: one collection group with one leaf. */
const SCHEMA = z.object({ equipment: z.array(z.object({ type: z.string() })) });

/** The cell the collection leaf carries. */
const cellOf = (expected: ScoreCase["expected"], produced: EvalJsonValue) => {
  const score = scoreEvalOverSchema({
    schema: SCHEMA,
    cases: [{ id: "c", expected, defaults: [] }],
    results: [extracted("c", produced)],
  });
  const cell = score.cases[0]?.cells["equipment.type"];
  if (cell === undefined) throw new Error("no cell");
  return cell;
};

test("an ordinal-keyed expectation matched element-wise is correct", () => {
  const cell = cellOf(
    { "equipment.type": { status: "asserted", value: { "0": "Furnace", "1": "Boiler" } } },
    { equipment: [{ type: envelope("Furnace") }, { type: envelope("Boiler") }] },
  );
  expect(cell.verdict).toBe("correct");
  // The cell carries the produced instances, in order.
  expect(cell.got).toEqual(["Furnace", "Boiler"]);
});

test("a mismatch in any position is wrong", () => {
  const cell = cellOf(
    { "equipment.type": { status: "asserted", value: { "0": "Furnace", "1": "Boiler" } } },
    { equipment: [{ type: envelope("Furnace") }, { type: envelope("Furnace") }] },
  );
  expect(cell.verdict).toBe("wrong");
});

test("extra produced instances are wrong", () => {
  const cell = cellOf(
    { "equipment.type": { status: "asserted", value: { "0": "Furnace" } } },
    { equipment: [{ type: envelope("Furnace") }, { type: envelope("Boiler") }] },
  );
  expect(cell.verdict).toBe("wrong");
});

test("an expectation with nothing produced is missed", () => {
  const cell = cellOf({ "equipment.type": { status: "asserted", value: { "0": "Furnace" } } }, {});
  expect(cell.verdict).toBe("missed");
  expect(cell.got).toBeNull();
});

test("a declared-absent collection leaf with a produced value is hallucinated", () => {
  const cell = cellOf(
    { "equipment.type": { status: "declared-absent" } },
    { equipment: [{ type: envelope("Furnace") }] },
  );
  expect(cell.verdict).toBe("hallucinated");
});

test("a declared-absent collection leaf with nothing produced is correct", () => {
  const cell = cellOf({ "equipment.type": { status: "declared-absent" } }, {});
  expect(cell.verdict).toBe("correct");
});

/** A collection whose leaf is an enum: the shape every Snugg collection enum takes. */
const ENUM_SCHEMA = z.object({
  equipment: z.array(z.object({ type: z.enum(["Furnace", "Boiler", "Heat pump"]) })),
});

/** The cell the collection enum leaf carries. */
const enumCellOf = (expected: ScoreCase["expected"], produced: EvalJsonValue) => {
  const score = scoreEvalOverSchema({
    schema: ENUM_SCHEMA,
    cases: [{ id: "c", expected, defaults: [] }],
    results: [extracted("c", produced)],
  });
  const cell = score.cases[0]?.cells["equipment.type"];
  if (cell === undefined) throw new Error("no cell");
  return cell;
};

test("a collection enum's ordinal-keyed expectation of members is judged, not unscorable", () => {
  const cell = enumCellOf(
    { "equipment.type": { status: "asserted", value: { "0": "Furnace", "1": "Boiler" } } },
    { equipment: [{ type: envelope("Furnace") }, { type: envelope("Boiler") }] },
  );
  expect(cell.verdict).toBe("correct");
});

test("a collection enum producing a different member is wrong", () => {
  const cell = enumCellOf(
    { "equipment.type": { status: "asserted", value: { "0": "Furnace", "1": "Boiler" } } },
    { equipment: [{ type: envelope("Furnace") }, { type: envelope("Heat pump") }] },
  );
  expect(cell.verdict).toBe("wrong");
});

test("a collection enum expectation naming a non-member stays unscorable", () => {
  const cell = enumCellOf(
    { "equipment.type": { status: "asserted", value: { "0": "Furnace", "1": "Stove" } } },
    { equipment: [{ type: envelope("Furnace") }, { type: envelope("Boiler") }] },
  );
  expect(cell).toMatchObject({ verdict: "unscorable", reason: "incomparable-expectation" });
});

test("a collection enum whose alternative names only members is comparable", () => {
  const cell = enumCellOf(
    {
      "equipment.type": {
        status: "asserted",
        value: { "0": "Furnace", "1": "Stove" },
        alternatives: [{ "0": "Furnace", "1": "Boiler" }],
      },
    },
    { equipment: [{ type: envelope("Furnace") }, { type: envelope("Boiler") }] },
  );
  expect(cell.verdict).toBe("correct");
});
