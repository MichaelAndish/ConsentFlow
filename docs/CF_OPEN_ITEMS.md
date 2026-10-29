# ConsentFlow decision register (CF-001 – CF-031)

UI-focused sprint. Demo Mode / synthetic data only. Do not treat UI status as Ethics Committee approval.

| ID | Decision | Priority | Verdict | Status |
|----|----------|----------|---------|--------|
| CF-001 | Actionable dashboard cards | P1 | **True** (PI Review / Missing Facts had no useful navigation) | **UI fixed** — cards open study Matrix / Facts |
| CF-002 | Document lifecycle semantics | P0 | **Partially true** (status mix ambiguous) | **UI clarified** — Generated / Awaiting PI / Approved / Exported strip; export ≠ approval labels |
| CF-003 | Structured issue resolution | P0 | **True** (one-click Confirm) | **UI fixed** — Record decision dialog → `pending_propagation` → resolve |
| CF-004 | Clear progress counting | P1 | **True** | **UI fixed** — `computeDocumentProgress`; denominators = applicable docs |
| CF-005 | Typed issue taxonomy | P1 | Partially true | Types exist; filters incomplete — **open** |
| CF-006 | Template governance roles | P0 | Requirement; backend not present | **Deferred** — UI role labels only |
| CF-007 | Persistent evidence-based resolution | P0 | **True** (in-memory only) | **UI session sync**; durable audit **NOT VERIFIED** |
| CF-008 | Consistent counters | P0 | **True** | **UI fixed** — shared `countOpenIssues` across Dashboard / Workspace / Consistency |
| CF-009 | Verify GCS / IAM | P1 | Claims were UI-only | **Deferred** — labels demoted to demo |
| CF-010 | PDF/DOCX parsing provenance | P0 | Unverified | **NOT VERIFIED** / deferred |
| CF-011 | Honest preflight | P0 | **True** | **UI fixed** — wizard no longer claims legal certification |
| CF-012 | Study form validation | P1 | Needs testing | **Open** (light UI only) |
| CF-013 | Audience/language applicability | P1 | 12 default variants | **Open** |
| CF-014 | Resume wizard | P2 | Proposed | **Deferred** |
| CF-015 | Cross-view issue sync | P0 | **True** | **UI fixed** with CF-007/008 (session state) |
| CF-016 | Evidence citation viewer | P1 | **True** (not clickable) | **Partial** — marked unavailable; real viewer deferred |
| CF-017 | Actual ingestion/provenance | P0 | Unverified | **NOT VERIFIED** |
| CF-018 | Explain confidence | P1 | **True** | **UI fixed** — demo/heuristic callouts |
| CF-019 | Site compliance checklist | P1 | Synthetic sites | **Open** / honesty deferred |
| CF-020 | GCS processing logs | P0 | Unverified claims | **UI honesty** (demo metrics); real logs deferred |
| CF-021 | Draft generation / DOCX | P0 | Not real | **UI Generate Drafts** (status only); DOCX **NOT VERIFIED** |
| CF-022 | Draft revision / deletion rules | P1 | Requirement | **Open** |
| CF-023 | Source Documents & Evidence labels | P1 | **True** | **UI fixed** |
| CF-024 | Separate onboard vs Generate Drafts | P0 | **True** | **UI fixed** — workspace **Generate Drafts** CTA |
| CF-025 | Synthetic ingestion acceptance | P0 | Blocked on fixtures | **Deferred** |
| CF-026 | Open uploaded originals | P1 | Not interactive | **Deferred** (unavailable labels) |
| CF-027 | Backend role enforcement | P0 | UI-only profile | **NOT VERIFIED** / deferred |
| CF-028 | Delete/archive rules | P1 | Requirement | **Open** |
| CF-029 | Approval + blocker gate | P0 | **True** | **UI fixed** — block approve with high-severity open/pending issues |
| CF-030 | Preview-first inspector | P1 | **True** | **UI fixed** |
| CF-031 | Simplify navigation | P1 | Fragmented | **Partial** — Sources rename / drafts CTA; full nav collapse **open** |

## Explicitly deferred (section F)

- Real protocol ingestion / extraction
- Real GCS/IAM
- PI DOCX re-import diffs
- Official template protected-wording review
- DOCX formatting round-trip

## Demo honesty

Session-only issue decisions and document status changes. Refresh reloads seed data unless DB persistence is enabled and verified separately.
