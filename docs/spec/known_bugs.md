# Known Bugs

## BUG-001: Duplicate `#font-select` ID in HTML

**File:** `src/main.ts`
**Lines:** ~468 (inside `#confirmDeleteModal`) and ~686 (inside `#resumeModal` footer)

The HTML injected by `main.ts` contains two elements with `id="font-select"`. The first appears in the `#confirmDeleteModal` header (likely a copy-paste error from the preview modal). The second is in the `#resumeModal .modal-footer` and is the intended one.

**Impact:**
- `document.getElementById('font-select')` and `document.querySelector('#font-select')` will always resolve to the first occurrence (inside the delete confirmation modal), not the preview modal font switcher.
- The font select in `main.ts` lines ~814-828 may be targeting the wrong element.
- The preview modal's font-select only works because it is queried with the more specific selector `#resumeModal .modal-footer #font-select`.

**Workaround in code:** The show-resume handler uses `document.querySelector('#resumeModal .modal-footer #font-select')` as primary query and falls back to `document.getElementById('font-select')`.

---

## BUG-002: Delete Confirmation Modal Has Wrong Header Title

**File:** `src/main.ts`
**Lines:** ~462-483 (the `#confirmDeleteModal` HTML block)

The `#confirmDeleteModal` modal header shows **"履歴書プレビュー"** as the title (`#resumeModalLabel`), but the modal body correctly says "入力内容を削除します。よろしいですか？". The header title is copied from the preview modal.

**Impact:** Users see the wrong title in the delete confirmation dialog.

---

## BUG-003: Double Form Initialization on Page Load

**File:** `src/main.ts`

Form data is loaded from IndexedDB and applied to the DOM in two separate places:

1. Inside the `DOMContentLoaded` listener (lines ~549-553)
2. In a top-level IIFE immediately after the listener definition (lines ~836-844)

Both call `loadResume()` and `loadToForm(jsonToFormResume(...))`. The IIFE runs before `DOMContentLoaded` fires if the document is already loaded, and the DOM may not yet contain the form elements injected by the `DOMContentLoaded` handler.

**Impact:** Potential double DB read; the IIFE may silently fail to apply data if form inputs don't exist yet. Both enable `#show-resume`, which is benign but redundant.

---

## BUG-004: `#tel2-input` Missing `name` Attribute

**File:** `src/main.ts`
**Line:** ~434 (the tel2 input inside the accordion)

```html
<input type="tel" class="form-control" id="tel2-input" pattern="\d{2,4}-?\d{2,4}-?\d{3,4}" ...>
```

The `name` attribute is absent. `saveFromForm()` in `resume.ts` accesses tel2 by `#tel2-input` selector, not by `name`, so this does not break save/load. However, form submission (if ever added) would not include this field.

---

## BUG-005: Duplicate `pattern` Attribute on `#zip-code-input`

**File:** `src/main.ts`
**Line:** ~394

The zip code input has `pattern` declared twice:
```html
pattern="\d{3}-?\d{4}" ... pattern="\\d{7}" title="7桁の数字を入力してください"
```
HTML parsers use the last value. The effective pattern is `\d{7}` (exactly 7 digits, no hyphen), which conflicts with the first pattern (`\d{3}-?\d{4}` which allows a hyphen) and the `formatZipCode` utility which handles both formats.

---

*Created at commit: de529fb*
