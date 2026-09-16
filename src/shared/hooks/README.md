# shared/hooks

React hooks that two or more features reuse.

- Hooks stay framework-bound (React only — no Next primitives unless generic).
- Every hook ships with tests.
- Prefer Zustand selectors over `useState`+`useEffect` for derived
  application state (see ADR-0003).
