import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  emptyText: string;
  isEmpty: (data: T) => boolean;
  render: (data: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, emptyText, isEmpty, render }: Props<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setData(undefined);
    setError(undefined);
    setLoading(true);
    getJson<T>(path)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unexpected response error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading && <p role="status">Loading {title.toLowerCase()}...</p>}
        {!loading && error && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
        {!loading && !error && data !== undefined && (
          isEmpty(data) ? <p>{emptyText}</p> : render(data)
        )}
      </div>
    </section>
  );
}
