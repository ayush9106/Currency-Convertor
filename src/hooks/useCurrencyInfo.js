import { useEffect, useState } from "react";

const cache = new Map();

function useCurrencyInfo(currency) {
  const [result, setResult] = useState(() => ({
    currency,
    data: cache.get(currency) || {},
    error: null,
    loaded: cache.has(currency),
  }));

  if (result.currency !== currency) {
    const cached = cache.get(currency);
    setResult({
      currency,
      data: cached || {},
      error: null,
      loaded: Boolean(cached),
    });
  }

  useEffect(() => {
    if (cache.has(currency)) return;

    let cancelled = false;

    fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch rates (${res.status})`);
        return res.json();
      })
      .then((res) => {
        const rates = res[currency] || {};
        cache.set(currency, rates);
        if (!cancelled) setResult({ currency, data: rates, error: null, loaded: true });
      })
      .catch((err) => {
        if (!cancelled) setResult({ currency, data: {}, error: err.message, loaded: true });
      });

    return () => {
      cancelled = true;
    };
  }, [currency]);

  return { data: result.data, loading: !result.loaded, error: result.error };
}

export default useCurrencyInfo;
