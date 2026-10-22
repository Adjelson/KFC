import test from "node:test";
import assert from "node:assert/strict";
import { loadSettings, DEFAULT_SETTINGS } from "../src/audio.js";
const storage = (value) => ({ getItem: () => value });
test("muted sound, music and motion preferences survive storage loading", () => {
  const result = loadSettings(
    storage(
      JSON.stringify({
        enabled: false,
        effects: false,
        music: true,
        volume: 35,
        animations: false,
        landscape: false,
      }),
    ),
  );
  assert.deepEqual(result, {
    enabled: false,
    effects: false,
    music: true,
    volume: 35,
    animations: false,
    landscape: false,
  });
});
test("invalid or inaccessible preferences fall back safely", () => {
  assert.deepEqual(loadSettings(storage("broken")), DEFAULT_SETTINGS);
  assert.deepEqual(
    loadSettings({
      getItem() {
        throw Error("storage blocked");
      },
    }),
    DEFAULT_SETTINGS,
  );
  assert.deepEqual(
    loadSettings(storage('{"enabled":"false","music":1,"volume":"100"}')),
    DEFAULT_SETTINGS,
  );
});
test("saved volume is bounded to an audible control range", () => {
  assert.equal(loadSettings(storage('{"volume":999}')).volume, 100);
  assert.equal(loadSettings(storage('{"volume":-30}')).volume, 0);
});
