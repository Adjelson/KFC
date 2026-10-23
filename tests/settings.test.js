import test from "node:test";
import assert from "node:assert/strict";
import { loadSettings, DEFAULT_SETTINGS, SoundEngine } from "../src/audio.js";
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
test("level, order and customer sounds are distinct and respect audio settings", () => {
  const engine = new SoundEngine();
  engine.context = { currentTime: 0, state: "running" };
  const notes = [];
  engine.note = (...args) => notes.push(args);
  const tunes = ["start", "orderComplete", "levelWin", "levelLose"].map(
    (event) => {
      notes.length = 0;
      engine.play(event);
      assert.ok(notes.length >= 3);
      return JSON.stringify(notes.map((note) => note[0]));
    },
  );
  assert.equal(new Set(tunes).size, 4);
  const moods = ["happy", "waiting", "angry"].map((mood) => {
    notes.length = 0;
    engine.reaction(mood);
    assert.equal(notes.length, 2);
    return JSON.stringify(notes.map((note) => note[0]));
  });
  assert.equal(new Set(moods).size, 3);
  for (const preferences of [
    { enabled: false },
    { effects: false },
    { volume: 0 },
  ]) {
    engine.settings = { ...DEFAULT_SETTINGS, ...preferences };
    notes.length = 0;
    engine.play("levelWin");
    engine.reaction("angry");
    assert.equal(notes.length, 0);
  }
  engine.settings = { ...DEFAULT_SETTINGS };
  engine.visible = false;
  engine.play("orderComplete");
  engine.reaction("happy");
  assert.equal(notes.length, 0);
});
