# Databases

## Technology

- **Dexie 4** wrapping the browser's native **IndexedDB** API.
- No backend. All persistence is entirely client-side.

---

## `ResumeDB` (class, extends Dexie)

Database name: `"ResumeDB"`
Schema version: **4**
Table: `resumes` — primary key is `createdAt` (string, ISO date)

```ts
class ResumeDB extends Dexie {
  resumes: Table<ResumeRecord, number>;
}
```

> `id` is not used as primary key; `createdAt` is the unique identifier for upsert logic.

---

## `ResumeRecord` interface

Stored row in the `resumes` table.

| Field | Type | Description |
|---|---|---|
| `id?` | `number` | Auto-generated (optional) |
| `createdAt` | `string` | ISO date string; primary key |
| `json` | `ResumeJson` | Full resume payload |

---

## `ResumeJson` interface

The canonical storage and JSON export format. Defined in `src/db.ts`.

### Top-level fields

| Field | Type | Notes |
|---|---|---|
| `fullnameKana` | `string` | Furigana |
| `fullname` | `string` | Kanji name |
| `sex` | `string` | Gender |
| `birthday` | `string` | ISO date |
| `age` | `number` | Computed at save; `0` when not recalculated |
| `zipCode` | `string` | Postal code |
| `address1Kana` | `string` | Furigana address 1 (not captured by current UI, stored as `""`) |
| `address1` | `string` | Primary address |
| `tel1` | `string` | Primary phone |
| `mail1` | `string` | Primary email |
| `address2Kana` | `string` | Furigana address 2 (not captured, stored as `""`) |
| `address2` | `string` | Alternative address |
| `tel2` | `string` | Alternative phone |
| `mail2` | `string` | Alternative email |
| `photo` | `string` | Profile photo (not captured, stored as `""`) |
| `createdAt` | `string` | Document date (ISO date) |
| `career?` | `Career[]` | Legacy flat format (optional; used only on import) |
| `license?` | `License[]` | Legacy flat format (optional; used only on import) |

### `resume` nested object

| Field | Type | Notes |
|---|---|---|
| `education` | `string[]` | Not captured by UI; stored as `[]` |
| `career` | `Career[]` | Current format for career entries |
| `license` | `License[]` | Current format for licence entries |
| `subject` | `string` | Not captured by UI; stored as `""` |
| `condition` | `string` | Not captured by UI; stored as `""` |
| `hobby` | `string` | Not captured by UI; stored as `""` |
| `reason` | `string` | Not captured by UI; stored as `""` |
| `expectations` | `string` | Not captured by UI; stored as `""` |

---

## API Functions

### `saveResume(resume: ResumeJson): Promise<void>`

Upsert by `createdAt`:
1. Deletes existing record where `createdAt` equals the incoming value.
2. Inserts new record via `db.resumes.put({ createdAt, json: resume })`.

### `loadResume(): Promise<ResumeJson | undefined>`

Returns the most recently created record (ordered by `createdAt` descending, first result). Returns `undefined` if no records exist.

### `clearResume(): Promise<void>`

Deletes all records from the `resumes` table.

---

## Backwards Compatibility

`jsonToFormResume()` in `main.ts` handles legacy JSON exports where `career` and `license` appear at the top level of `ResumeJson` (outside the `resume` nested object). The resolver checks `json.resume.career` first, then falls back to `json.career`.

---

*Created at commit: de529fb*
