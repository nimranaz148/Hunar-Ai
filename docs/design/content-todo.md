# Content to replace before launch

The redesign ships with working layouts and honest placeholders. These are the places that still
hold placeholder content. Nothing here is a hidden claim; each is labelled in the UI or in code.

| Where | What it is now | What it needs |
|---|---|---|
| Landing: Stories (`components/landing/Stories.tsx`) | Four **sample** stories, tagged "Sample stories" in the UI | Real, consented founder stories (name, city, business, quote) |
| Landing: hero mascot (`Mascot.tsx`) | Flat vector placeholder | Google Flow artwork, see `hero-prompts.md` |
| Landing: Network (`Network.tsx`) | "Coming soon" LinkedIn section, no functional claims | PRD change request and ADR 0002 acceptance before it ships as a feature |
| Landing: step cards (`StepCards.tsx`) | Illustrative sample data | Optionally real product screenshots |
| Landing: Proof clips | Two short clips selected from the earlier video set | Final clips if the brand wants them re-rendered flat |
| Footer | Navigation and account links only | Terms and Privacy pages, then link them |
| Landing copy | Written from PRD facts | Native-speaker review of the Roman Urdu lines |
| Dashboard: "Highest conversion channel" line | Static text carried over from the previous design | Drive from real metrics, or remove |

## Claims deliberately not made

- No user counts, revenue figures or ratings (the previous page claimed "500+ entrepreneurs" and
  "10K+" with no data behind it).
- No "escrow" wording on the marketing page. Payments are simulated in v2 (PRD A-006), so the page
  describes the workflow only: payment is held, then released after the session.
