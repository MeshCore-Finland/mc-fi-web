import { useEffect, useState } from 'react';
import './network-stats.css';
export interface StatsLabels {
  repeaters: string;
  packets: string;
  loading: string;
  updated: string;
  unavailable: string;
}
type Snapshot = {
  packets: number | null;
  repeaters: number | null;
  updated: Date | null;
};
export default function NetworkStats({
  labels,
  locale,
}: {
  labels: StatsLabels;
  locale: string;
}) {
  const [data, setData] = useState<Snapshot>({
    packets: null,
    repeaters: null,
    updated: null,
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const refresh = async () => {
      const outcomes = await Promise.allSettled([
        fetch('https://corescope.meshcore.fi/api/stats', {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        }).then(async (response) => {
          if (!response.ok) throw new Error();
          const json = await response.json();
          if (typeof json.packetsLast24h !== 'number') throw new Error();
          return json.packetsLast24h;
        }),
        fetch('https://shark-api.meshcore.fi/api/v1/nodes?limit=1000', {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        }).then(async (response) => {
          if (!response.ok) throw new Error();
          const json = await response.json();
          if (!Array.isArray(json.nodes)) throw new Error();
          return json.nodes.filter(
            (node: {
              role: string;
              freshness: string;
              lat: number;
              lon: number;
            }) =>
              node.role === 'repeater' &&
              node.freshness === 'fresh' &&
              Number.isFinite(node.lat) &&
              Number.isFinite(node.lon) &&
              node.lat >= 59.85 &&
              node.lat <= 70.3 &&
              node.lon >= 19 &&
              node.lon <= 31.7,
          ).length;
        }),
      ]);
      if (!active) return;
      setData({
        packets: outcomes[0].status === 'fulfilled' ? outcomes[0].value : null,
        repeaters:
          outcomes[1].status === 'fulfilled' ? outcomes[1].value : null,
        updated: outcomes.some((outcome) => outcome.status === 'fulfilled')
          ? new Date()
          : null,
      });
      setLoading(false);
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);
  const format = new Intl.NumberFormat(locale);
  const display = (value: number | null) =>
    value === null ? '—' : format.format(value);
  return (
    <div className="network-stats" data-pagefind-ignore>
      <div>
        <span className="stat-value">{display(data.repeaters)}</span>
        <span>{labels.repeaters}</span>
      </div>
      <div>
        <span className="stat-value">{display(data.packets)}</span>
        <span>{labels.packets}</span>
      </div>
      <p>
        {loading
          ? labels.loading
          : data.updated
            ? labels.updated +
              ' ' +
              data.updated.toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
              })
            : labels.unavailable}
      </p>
    </div>
  );
}
