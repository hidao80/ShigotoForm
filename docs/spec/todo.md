# TODO

## UI / Features

- [ ] **Photo upload** — `ResumeJson.photo` field exists but is never populated by the UI; add a photo input and preview in the résumé.
- [ ] **Address furigana** — `address1Kana` / `address2Kana` fields exist in `ResumeJson` but are not exposed in the form.
- [ ] **Additional résumé sections** — `subject`, `condition`, `hobby`, `reason`, `expectations`, `education[]` fields exist in `ResumeJson` but have no corresponding form inputs.
- [ ] **Age field in `ResumeJson`** — `age` is set to `0` during `formResumeToJson()` except for the birthday-change handler which sets it correctly; all save paths should consistently compute and store `age`.
- [ ] **`mail2` field** — Defined in `Resume` and `ResumeJson`, and read/written by `saveFromForm()`/`loadToForm()`, but no `mail2` input exists in the form HTML. Either add the input or remove the field.

## Bugs to Fix

- [ ] Fix duplicate `#font-select` ID (see `known_bugs.md` BUG-001)
- [ ] Fix `#confirmDeleteModal` header title (see `known_bugs.md` BUG-002)
- [ ] Remove duplicate form initialization IIFE (see `known_bugs.md` BUG-003)
- [ ] Add `name` attribute to `#tel2-input` (see `known_bugs.md` BUG-004)
- [ ] Resolve duplicate `pattern` on `#zip-code-input` (see `known_bugs.md` BUG-005)

## Testing

- [ ] Add unit tests with **Vitest** for `jsonToFormResume`, `formResumeToJson`, `generateResumeHtml`, `formatDate`, `formatZipCode`
- [ ] Add Playwright E2E tests beyond the current screenshot-only spec:
  - Form fill and auto-save verification
  - Import/export round-trip
  - PDF download trigger
  - PWA update flow
  - Dark mode persistence
- [ ] Tests should mirror `src/` structure under `tests/` and use `*.spec.ts` naming

## Code Quality

- [ ] Extract the inline HTML string in `main.ts` (`appEl.innerHTML = ...`) into a separate template file or function for maintainability
- [ ] Consider splitting `main.ts` (currently ~845 lines) into sub-modules (e.g. `pwa.ts`, `events.ts`, `pdf.ts`)
- [ ] Add `name` attribute to the accordion tel2 input for consistency

## Infrastructure

- [ ] Pin `packageManager` field in `package.json` to a specific pnpm version matching the Dockerfile
- [ ] Add a `test:unit` script once Vitest is set up
- [ ] CI: add a lint step running `pnpm lint` in the build workflow

---

*Created at commit: de529fb*
