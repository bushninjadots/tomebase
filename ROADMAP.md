# TomeBase — Product Roadmap

## Vision

One cohesive product. Not a collection of separate systems — a unified documentation platform where AI, editing, health monitoring, and personality feel like parts of a single experience.

---

## Priority 1 — Refactor

Don't add features until the foundation is solid.

- Remove duplicated components
- Consolidate state (stores, contexts, local state)
- Reduce API duplication
- Improve folder structure
- Simplify providers
- Remove dead code
- Standardize naming conventions
- Improve TypeScript typings
- Split large files
- Reduce unnecessary rerenders
- Improve loading states
- Add proper error boundaries
- Improve caching strategy
- Improve logging

---

## Priority 2 — TomeSpirit 2.0

Make it memorable, alive, and delightful. This is the feature people will talk about.

### Movement

- Smooth floating with idle wandering
- Occasionally inspect UI elements
- Look at the user's cursor
- React to scrolling
- Slight squash and stretch while moving
- Small breathing animation
- Momentum and easing

### Dragging

- Pick up and throw
- Physics-based inertia
- Bounce off screen edges
- Spin slightly while flying
- Recover and continue floating
- If thrown hard:
  - "Whoa!"
  - "I definitely meant to do that."
  - "10/10 landing."

### Speech

- Speech bubbles originate from the ghost's mouth
- Bubble follows him while visible
- Tail points to him
- Fade and scale in/out
- Never cover important UI
- Queue messages instead of overlapping

### Behaviour

- Gets excited after scans complete
- Celebrates fixes
- Looks sad when lots of issues exist
- Sleeps if idle
- Wakes when mouse moves
- Notices first-time users
- Random ambient comments every few minutes

### Design

- 20-30% slimmer, slightly taller
- Softer floating motion

---

## Priority 3 — AI Health

Turn it into a genuinely useful documentation engineer that users trust.

### Inspection

Health should scan for:

- Stale docs
- Broken links
- Orphan pages
- Missing summaries
- Unreadable pages
- Duplicate content
- Inconsistent terminology
- Missing diagrams
- Outdated APIs
- Empty sections
- Navigation problems
- Accessibility issues
- SEO issues
- Performance issues

### Actions

Every issue should offer:

- Fix Automatically
- Review Changes
- Explain Issue
- Ignore
- Create Task

### Quality

- Confidence scores on every finding
- AI reasoning explaining the issue
- Context-aware suggestions

---

## Priority 4 — Full Product Audit

Act like a senior engineer reviewing everything.

### UX

- Confusing flows
- Inconsistent spacing
- Typography
- Colors
- Icons
- Responsiveness
- Accessibility
- Mobile
- Onboarding

### Engineering

- Security
- Validation
- Race conditions
- Memory leaks
- Event listeners
- Performance
- Bundle size
- Database queries
- Error handling
- API consistency

### AI

- Prompt consistency
- Retry logic
- Streaming
- Context management
- Hallucination prevention
- Fallback models
- Cost optimization

### Product

- Duplicated features
- Unnecessary clicks
- Missing empty states
- Discoverability
- Monetization opportunities
- Onboarding
- Upgrade paths

---

## Priority 5 — Release Readiness Automation

Continuous quality gate before every release.

- Linting
- Type checking
- Tests
- Accessibility checks
- Performance metrics
- Dead code detection
- Security validation
- Responsive layout verification
- UI consistency checks

Generates a report with any blocking issues. No manual audit needed.
