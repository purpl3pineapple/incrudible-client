# incrudible-client

Shared client-side JS framework for InCRUDibly-based Apps Script apps,
built via `esbuild` and served via jsDelivr's GitHub CDN mode
(`@main`-pinned).

`APP.imageToUpload(file)` reads a browser `File` and resolves to
`{ name, mimeType, base64 }`, ready to combine with a Drive `folderId` for
`InCRUDibly.uploadImage`. It rejects non-image files and images larger than
10 MiB before starting `FileReader`.

`DAYS.daysElapsed(start, end, options)` counts signed whole days between two
strict `YYYY-MM-DD` dates. With `businessDays: true`, it excludes the start
date, includes the end date, skips weekends, and calls the optional
`isHoliday(isoDate)` predicate for caller-owned closure calendars.

```js
import { DAYS } from "incrudible-client";

const elapsed = DAYS.daysElapsed("2026-07-17", "2026-07-20", {
  businessDays: true,
  isHoliday: isoDate => bankClosures.has(isoDate),
});
// 1
```

## Docs

- [Form Control Reference](docs/form-controls.md) - every control type this
  library renders, each as a complete, standalone config example.
