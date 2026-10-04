# Currency Converter — Changes & Learning Guide

This document explains every change made to the project and the React concept behind it, so you can learn *why* the code looks the way it does now.

---

## Before / After overview

| Area | Before | After |
|------|--------|-------|
| Data fetching | Raw `fetch`, no states | `{ data, loading, error }` + caching |
| Conversion | Manual button + `setConvertedAmount` state | Derived during render (auto-updates) |
| Error handling | None (silently failed) | `res.ok` check + error message UI |
| Same currency | Allowed (wasted request) | Button disabled |
| Formatting | Raw decimals (e.g. `84.199999`) | `Intl.NumberFormat` (`84.20`) |
| Extras | — | Loading state, input validation |

---

## 1. `src/hooks/useCurrencyInfo.js`

### The 3 states of async code

Every network request has 3 possible outcomes. The hook now exposes all of them:

```js
return { data: result.data, loading: !result.loaded, error: result.error };
```

| State | Meaning | UI uses it to... |
|-------|---------|------------------|
| `loading` | Fetch still in progress | Show "Loading rates..." |
| `error` | Fetch failed | Show the error message |
| `data` | Fetch succeeded | Build the currency options + convert |

**Lesson:** never design an async function that only returns the happy-path result.

### `fetch` does NOT throw on HTTP errors

```js
.then((res) => {
  if (!res.ok) throw new Error(`Failed to fetch rates (${res.status})`);
  return res.json();
})
```

A 404 or 500 response still resolves the promise. You must check `res.ok` yourself and throw manually so the `.catch()` runs.

### Module-level cache (not state!)

```js
const cache = new Map();  // lives OUTSIDE the component
```

- It persists for the app's whole lifetime (component state would reset on re-render).
- `cache.has(currency)` → instant result, no network call.
- Switching USD → EUR → USD only fetches each currency once.

### "Adjust state when a prop changes" pattern

When the `currency` prop changes, React docs say: **compare the previous prop in state, and if it differs, set state during render** (React re-renders immediately before painting):

```js
if (result.currency !== currency) {
  const cached = cache.get(currency);
  setResult({ currency, data: cached || {}, error: null, loaded: Boolean(cached) });
}
```

This replaced two things that React's own lint rules now forbid:
- `useRef` read during render (`react-hooks/refs`)
- synchronous `setState` inside `useEffect` (`react-hooks/set-state-in-effect`)

### Stale-response guard (`cancelled` flag)

```js
useEffect(() => {
  let cancelled = false;
  fetch(...).then((res) => {
    if (!cancelled) setResult(...);
  });
  return () => { cancelled = true; };  // cleanup on unmount OR dep change
}, [currency]);
```

If the user switches currency *while* the old request is in flight, React runs the cleanup, sets `cancelled = true`, and the old response is thrown away — so EUR data can never overwrite an INR request.

---

## 2. `src/App.jsx`

### Derived state — the single most important concept

**Before** we stored the converted result in state and updated it with a button + effect:

```js
const [convertedAmount, setConvertedAmount] = useState(0);
// convert() called on submit / inside useEffect
```

**After** we compute it during render:

```js
const convertedAmount =
  amountValid && currencyInfo[to] ? amount * currencyInfo[to] : 0;
```

**Rule of thumb:** *if a value can be computed from other state, don't store it in state.* Just derive it. That gives you "auto-convert" for free, always in sync, zero risk of stale state, and no effect needed.

### Validation as derived booleans

```js
const amountValid = Number.isFinite(amount) && amount >= 0;
const isSameCurrency = from === to;
```

- `Number()` can produce `NaN` (empty input) — `Number.isFinite` catches it.
- The button is disabled when invalid or same currency.

### Pure formatting function outside the component

```js
const formatNumber = (num) =>
  Number.isFinite(num)
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
    : '0.00';
```

- `Intl.NumberFormat` is the standard built-in for localized number/currency formatting.
- It's defined **outside** the component so it isn't re-created every render.
- The `Number.isFinite` guard prevents `Intl` from throwing on `undefined`.

### Loading / error UI

```jsx
{loading ? "Loading rates..." : isSameCurrency ? "Select different currencies" : `Convert ${from.toUpperCase()} to ${to.toUpperCase()}`}
```

The button now reflects app state instead of always saying the same thing.

---

## 3. `src/components/InputBox.jsx`

### Only import what you use

```js
import { useId } from "react";   // was: import React, { useId }
```

With modern JSX you don't need the default `React` import.

### Honor the `className` prop

`className` was destructured but never applied — now merged:

```js
<div className={`bg-white p-3 rounded-lg text-sm flex ${className}`}>
```

A prop that is received but ignored is a bug waiting to happen.

### Empty-state placeholder

```jsx
{currencyOptions.length === 0 && (
  <option value="" disabled>Loading...</option>
)}
```

Prevents a blank dropdown while rates are loading.

---

## Summary — 6 takeaways

1. **Derive, don't store** — compute values from other state during render instead of `setState`.
2. **Async = 3 states** — pending / success / error; expose all of them.
3. **`fetch` won't throw on 4xx/5xx** — always check `res.ok`.
4. **Guard against stale responses** — use a `cancelled` cleanup in `useEffect`.
5. **Cache at module level**, not in component state.
6. **Let lint teach you** — the `react-hooks` rules encode the official patterns from `react.dev`.
