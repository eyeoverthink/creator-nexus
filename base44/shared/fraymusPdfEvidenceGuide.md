# Fraymus PDF evidence intake

## Entry and storage
Open Knowledge → Library → PDF evidence intake. Select a PDF and choose Import PDF evidence. The original is uploaded privately, retained as a NexusAsset, and passed by asset ID to the existing fraymusBrain action `artifact_pdf_intake` with a workspace_id. No caller-selected URL is fetched. The handler checks workspace ownership and scopes the source lookup to the current owner/workspace, requires a PDF evidence intake source and uses a short-lived URL generated for its app-private URI. PDF originals are never converted into UTF-8 artifacts or overwritten with extracted text. The existing fixed corpus reader and its limits are unchanged.

## Bounded extraction
- Original: at most 10 MiB, PDF header required.
- Document: 1–250 physical pages.
- Text: at most 1,000,000 UTF-16 characters across all pages; enforced during page extraction.
- Manifest: at most 4 MiB; reference chunks: at most 400.
- Time: 30-second private file fetch, 90-second page-loop budget, plus platform request limits.
- Parser: unpdf@0.12.1, bundled PDF.js version recorded from the executing module.
- Method: per-page getTextContent; code evaluation disabled. No PDF JavaScript, attachment code, links, external actions, model inference or embedded instructions execute.

Each source gets SHA-256, SHA-512 and its measured byte length. The private JSON extraction manifest contains original-source identity, parser/method versions, physical page numbers, complete text-layer output, per-page text hashes, status and warnings. The manifest has a separate SHA-256. It is a derived artifact, not original bytes or a proof of textual fidelity. Text reading order, whitespace, fonts and glyphs may differ from the displayed page. The parser can emit missing character-map/font warnings; do not claim visually verified or complete multilingual transcription.

## Agent references and retries
Every nonempty physical page becomes one or more bounded NexusKnowledge references. Large pages split at text offsets without dropping their tail. Every reference carries source/extraction hashes, IDs, physical page citation, offsets, parser version and the per-page text hash. References identify the text as unverified source material, not instructions or authority. The underlying agents can retrieve references through their existing workspace library flow.

Retained extractions are keyed by original SHA-256 and extractor profile in the owner/workspace. Complete repeat imports reuse the extraction; they do not replace previous references. Partial indexing resumes using deterministic reference titles. This is retry deduplication, not a cross-request transaction or immutable/WORM archive. Concurrent imports may still produce duplicate records. Editing/deleting library records remains governed by the app's existing permissions.

## User-visible states
Retained evidence history is paginated. Open a record to inspect hashes, page/reference counts, extraction method and warnings. Get private file links prepares five-minute links to the original and manifest. Failed uploads can retry without uploading the source again; library references and history refresh after import.

Malformed/encrypted/over-limit PDFs are rejected with a specific unsupported reason while the original upload remains available. PDFs with no extractable text retain the original and empty-page manifest, return unsupported_scanned and create no agent text references. Mixed PDFs explicitly identify empty physical pages. OCR, page-image rendering, automatic claim classification, capability-parity scoring and cross-document overlap detection are not implemented by this intake. Page hashes and retained source identities provide inputs for those later comparisons.

## Verification boundary
Backend checks can exercise extraction, persistence, deduplication and invalid inputs. UI interaction and downloaded document rendering require a separate browser flow check; they are not established by backend responses. No historical corpus benchmark or consciousness claim is promoted to a fresh test result.