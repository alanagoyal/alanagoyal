import assert from "node:assert/strict";
import test from "node:test";
import {
  getDuplicateTextEditPath,
  getRenamedTextEditPath,
  getUntitledTextEditPath,
} from "../lib/textedit-documents";

const documents = "/Users/alanagoyal/Documents";

test("creates a numbered untitled document without collisions", () => {
  assert.equal(getUntitledTextEditPath([]), `${documents}/Untitled.txt`);
  assert.equal(
    getUntitledTextEditPath([
      `${documents}/Untitled.txt`,
      `${documents}/Untitled 2.txt`,
    ]),
    `${documents}/Untitled 3.txt`
  );
});

test("duplicates into Documents while preserving the source extension", () => {
  assert.equal(
    getDuplicateTextEditPath("/Users/alanagoyal/Documents/hello.md", []),
    `${documents}/hello copy.md`
  );
  assert.equal(
    getDuplicateTextEditPath("/Users/alanagoyal/Projects/site/README.md", [
      `${documents}/README copy.md`,
    ]),
    `${documents}/README copy 2.md`
  );
});

test("rename preserves an omitted extension and rejects invalid or duplicate names", () => {
  assert.deepEqual(
    getRenamedTextEditPath(`${documents}/hello.md`, "welcome", []),
    { ok: true, path: `${documents}/welcome.md`, fileName: "welcome.md" }
  );
  assert.deepEqual(
    getRenamedTextEditPath(`${documents}/hello.md`, "welcome.txt", []),
    { ok: true, path: `${documents}/welcome.txt`, fileName: "welcome.txt" }
  );
  assert.deepEqual(
    getRenamedTextEditPath(`${documents}/hello.md`, "bad/name", []),
    { ok: false, error: "File names can’t contain slashes." }
  );
  assert.deepEqual(
    getRenamedTextEditPath(`${documents}/hello.md`, "welcome.md", [
      `${documents}/welcome.md`,
    ]),
    { ok: false, error: "A file with that name already exists." }
  );
});
