# incrudible-client

Shared client-side JS framework for InCRUDibly-based Apps Script apps,
built via `esbuild` and served via jsDelivr's GitHub CDN mode
(`@main`-pinned).

`APP.imageToUpload(file)` reads a browser `File` and resolves to
`{ name, mimeType, base64 }`, ready to combine with a Drive `folderId` for
`InCRUDibly.uploadImage`. It rejects non-image files and images larger than
10 MiB before starting `FileReader`.

## Docs

- [Form Control Reference](docs/form-controls.md) - every control type this
  library renders, each as a complete, standalone config example.
