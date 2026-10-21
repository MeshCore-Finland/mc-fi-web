import { useEffect, useState } from 'react';
import {
  loadRepeaterBundle,
  type RepeaterBundle,
} from '../../lib/repeater-bundle';
import './network-stats.css';
export interface StatsLabels {
  repeaters: string;
  packets: string;
  loading: string;
  updated: string;
  unavailable: string;
}
export default function NetworkStats({
  labels,
  locale,
  bundleUrl,
}: {
  labels: StatsLabels;
  locale: string;
  bundleUrl: string;
}) {
  const [data, setData] = useState<RepeaterBundle | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    void loadRepeaterBundle(bundleUrl)
      .then((bundle) => {
        if (active) setData(bundle);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bundleUrl]);
  const format = new Intl.NumberFormat(locale);
  const display = (value: number | undefined) =>
    value === undefined ? '—' : format.format(value);
  const activity = data?.packetActivity;
  const packetTotal = activity?.hourly.reduce(
    (sum, hour) => sum + hour.count,
    0,
  );
  const packetDate =
    activity &&
    new Date(`${activity.date}T00:00:00Z`).toLocaleDateString(locale, {
      timeZone: 'UTC',
      dateStyle: 'short',
    });
  return (
    <div className="network-stats" data-pagefind-ignore>
      <div>
        <span className="stat-value">{display(data?.nodes.length)}</span>
        <span>{labels.repeaters}</span>
      </div>
      <div>
        <span className="stat-value">{display(packetTotal)}</span>
        <span>
          {labels.packets}
          {packetDate && ` / ${packetDate}`}
        </span>
      </div>
      <p>
        {loading
          ? labels.loading
          : data
            ? labels.updated +
              ' ' +
              new Date(data.generatedAt).toLocaleString(locale, {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : labels.unavailable}
      </p>
    </div>
  );
}
