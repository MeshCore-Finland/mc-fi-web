import { useEffect, useId, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import {
  meshmapperEmbedUrl,
  meshmapperMapUrl,
  meshmapperSources,
  repeatersInBounds,
  type RegionMapConfig,
} from '../lib/region-maps';
import {
  loadRepeaterBundle,
  type RepeaterLocation,
} from '../lib/repeater-bundle';

interface Labels {
  locations: string;
  coverage: string;
  source: string;
  reset: string;
  loading: string;
  unavailable: string;
  empty: string;
  count: string;
  updated: string;
  stale: string;
  locationsNote: string;
  coverageNote: string;
  open: string;
  list: string;
  zoomIn: string;
  zoomOut: string;
  noScript: string;
}

interface Props {
  config: RegionMapConfig;
  labels: Labels;
  bundleUrl: string;
  locale: string;
  coverageNote?: string;
}

interface CoverageView {
  lat: number;
  lon: number;
  meters: number;
}

function viewForMap(
  config: RegionMapConfig,
  map: LeafletMap | null,
): CoverageView {
  const { south, west, north, east } = config.bounds;
  const center = map?.getCenter() ?? {
    lat: (south + north) / 2,
    lng: (west + east) / 2,
  };
  const viewport = map?.getBounds();
  const meters =
    viewport && map
      ? map.distance(
          [center.lat, viewport.getWest()],
          [center.lat, viewport.getEast()],
        )
      : (east - west) * 111_320 * Math.cos((center.lat * Math.PI) / 180);
  return {
    lat: center.lat,
    lon: center.lng,
    meters,
  };
}

export default function RegionMap({
  config,
  labels,
  bundleUrl,
  locale,
  coverageNote,
}: Props) {
  const id = useId();
  const [mode, setMode] = useState<'locations' | 'coverage'>('locations');
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>(
    'loading',
  );
  const [nodes, setNodes] = useState<RepeaterLocation[]>([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const sources = meshmapperSources(config);
  const [source, setSource] = useState(sources[0] ?? '');
  const [embeds, setEmbeds] = useState<
    Record<string, { url: string; revision: number }>
  >({});
  const initialCoverageView = useRef<CoverageView | null>(null);
  const defaultCoverageView = useRef<CoverageView | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const fullMapUrl = meshmapperMapUrl(config, source);

  useEffect(() => {
    let disposed = false;
    let instance: LeafletMap | undefined;
    let initialSizeObserver: ResizeObserver | undefined;
    let refreshVisibleNodes = () => {};
    async function initialize() {
      try {
        const L = await import('leaflet');
        if (disposed || !container.current) return;
        const { south, west, north, east } = config.bounds;
        const bounds = L.latLngBounds([south, west], [north, east]);
        instance = L.map(container.current, {
          scrollWheelZoom: false,
          zoomSnap: 0.25,
          zoomControl: false,
        });
        // Switching tabs while Leaflet downloads can hide its container before
        // initialization. Wait for a real size before calculating the first view.
        const frameInitialView = () => {
          if (!instance || !container.current?.clientWidth) return;
          initialSizeObserver?.disconnect();
          instance.invalidateSize({ pan: false });
          instance.fitBounds(bounds, { padding: [12, 12], animate: false });
          map.current = instance;
          defaultCoverageView.current = viewForMap(config, instance);
          refreshVisibleNodes();
        };
        initialSizeObserver = new ResizeObserver(frameInitialView);
        initialSizeObserver.observe(container.current);
        frameInitialView();
        L.control
          .zoom({ zoomInTitle: labels.zoomIn, zoomOutTitle: labels.zoomOut })
          .addTo(instance);
        L.control
          .scale({ imperial: false, position: 'bottomleft' })
          .addTo(instance);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(instance);

        const bundle = await loadRepeaterBundle(bundleUrl);
        if (disposed) return;
        const allNodes = [...bundle.nodes].sort((a, b) =>
          a.name.localeCompare(b.name, locale),
        );
        for (const node of allNodes) {
          const marker = L.marker([node.lat, node.lon], {
            icon: L.divIcon({
              className: 'region-repeater-marker',
              html: '<span></span>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
            title: node.name,
            alt: node.name,
            riseOnHover: true,
          });
          // Repeater names come from external data; never interpret them as HTML.
          const popup = document.createElement('div');
          const name = document.createElement('strong');
          name.textContent = node.name;
          const key = document.createElement('code');
          key.textContent = node.id.slice(0, 12);
          popup.append(name, document.createElement('br'), key);
          marker.bindPopup(popup).addTo(instance);
        }
        refreshVisibleNodes = () => {
          if (!instance || !map.current) return;
          const viewport = instance.getBounds();
          setNodes(
            repeatersInBounds(allNodes, {
              south: viewport.getSouth(),
              west: viewport.getWest(),
              north: viewport.getNorth(),
              east: viewport.getEast(),
            }),
          );
        };
        instance.on('moveend resize', refreshVisibleNodes);
        refreshVisibleNodes();
        setGeneratedAt(bundle.generatedAt);
        setStatus('ready');
      } catch (error) {
        if (!disposed) {
          setStatus('unavailable');
          console.warn('Regional repeater map unavailable', error);
        }
      }
    }
    void initialize();
    return () => {
      disposed = true;
      initialSizeObserver?.disconnect();
      instance?.remove();
      map.current = null;
    };
  }, [config, bundleUrl, labels.zoomIn, labels.zoomOut, locale]);

  useEffect(() => {
    if (mode === 'locations') map.current?.invalidateSize({ pan: false });
  }, [mode]);

  function loadSource(nextSource: string) {
    // All sources start at the same viewport, even if the repeater map is moved
    // between visits. Already loaded iframes retain their own state.
    initialCoverageView.current ??= viewForMap(config, map.current);
    const url = meshmapperEmbedUrl(
      config,
      initialCoverageView.current,
      nextSource,
    );
    if (!url) return;
    setEmbeds((current) =>
      current[nextSource]
        ? current
        : {
            ...current,
            [nextSource]: { url, revision: 0 },
          },
    );
  }

  function selectSource(nextSource: string) {
    loadSource(nextSource);
    setSource(nextSource);
  }

  function selectMode(next: 'locations' | 'coverage') {
    if (next === 'coverage' && source) loadSource(source);
    setMode(next);
  }

  function resetView() {
    if (mode === 'coverage') {
      const url = meshmapperEmbedUrl(
        config,
        defaultCoverageView.current ?? viewForMap(config, null),
        source,
      );
      if (!url) return;
      // A new iframe also resets an embed whose URL has not changed.
      setEmbeds((current) => ({
        ...current,
        [source]: { url, revision: (current[source]?.revision ?? 0) + 1 },
      }));
      return;
    }
    const { south, west, north, east } = config.bounds;
    map.current?.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      {
        padding: [12, 12],
        animate: false,
      },
    );
  }

  const stale =
    generatedAt && Date.now() - Date.parse(generatedAt) > 72 * 3_600_000;

  return (
    <section className="region-map not-content" aria-label={config.name}>
      <div className="region-map-toolbar">
        {fullMapUrl ? (
          <div
            role="tablist"
            aria-label={config.name}
            className="region-map-tabs"
          >
            {(['locations', 'coverage'] as const).map((tab, index) => (
              <button
                key={tab}
                ref={(element) => {
                  tabs.current[index] = element;
                }}
                id={`${id}-${tab}-tab`}
                type="button"
                role="tab"
                aria-selected={mode === tab}
                aria-controls={`${id}-${tab}-panel`}
                tabIndex={mode === tab ? 0 : -1}
                onClick={() => selectMode(tab)}
                onKeyDown={(event) => {
                  if (
                    !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? 1
                        : 1 - index;
                  tabs.current[next]?.focus();
                  selectMode(next === 0 ? 'locations' : 'coverage');
                }}
              >
                {labels[tab]}
                {tab === 'coverage' && (
                  <span className="region-map-provider">MeshMapper</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <strong>{labels.locations}</strong>
        )}
        <button className="region-map-reset" type="button" onClick={resetView}>
          {labels.reset}
        </button>
      </div>

      <div
        id={`${id}-locations-panel`}
        role={fullMapUrl ? 'tabpanel' : undefined}
        aria-labelledby={fullMapUrl ? `${id}-locations-tab` : undefined}
        hidden={mode !== 'locations'}
      >
        <div className="region-map-frame">
          <div
            ref={container}
            className="region-map-canvas"
            aria-label={`${config.name}: ${labels.locations}`}
          />
          {status !== 'ready' && (
            <p className="region-map-status" role="status">
              {status === 'loading' ? labels.loading : labels.unavailable}
            </p>
          )}
        </div>
        <div className="region-map-caption">
          <p className="region-map-meta" aria-live="polite">
            {status === 'ready' && (
              <>
                <strong>
                  {labels.count.replace('{count}', String(nodes.length))}
                </strong>
                <span>
                  {labels.updated}{' '}
                  <time dateTime={generatedAt}>
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium',
                      timeZone: 'Europe/Helsinki',
                    }).format(new Date(generatedAt))}
                  </time>
                </span>
              </>
            )}
          </p>
          <p>{labels.locationsNote}</p>
          {stale && <p>{labels.stale}</p>}
          {status === 'ready' && nodes.length === 0 && <p>{labels.empty}</p>}
          {nodes.length > 0 && (
            <details className="region-map-list">
              <summary>{labels.list}</summary>
              <ul>
                {nodes.map((node) => (
                  <li key={node.id}>{node.name}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      {fullMapUrl && (
        <div
          id={`${id}-coverage-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-coverage-tab`}
          hidden={mode !== 'coverage'}
        >
          {(sources.length > 1 || coverageNote) && (
            <div className="region-map-coverage-options">
              {sources.length > 1 && (
                <div className="region-map-source">
                  <label htmlFor={`${id}-source`}>{labels.source}</label>
                  <select
                    id={`${id}-source`}
                    value={source}
                    onChange={(event) => selectSource(event.target.value)}
                  >
                    {sources.map((name) => (
                      <option key={name} value={name}>
                        {name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {coverageNote && (
                <p className="region-map-coverage-note" role="note">
                  {coverageNote}
                </p>
              )}
            </div>
          )}
          <div className="region-map-frame">
            {Object.entries(embeds).map(([name, embed]) => (
              <iframe
                key={`${name}-${embed.revision}`}
                src={embed.url}
                hidden={source !== name}
                title={`${config.name}: ${labels.coverage} · MeshMapper ${name.toUpperCase()}`}
                loading="lazy"
              />
            ))}
          </div>
          <div className="region-map-caption">
            <p>{labels.coverageNote}</p>
          </div>
        </div>
      )}
      {fullMapUrl && (
        <a
          className="region-map-external"
          href={fullMapUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {labels.open} <span aria-hidden="true">↗</span>
        </a>
      )}
      <noscript>
        <p className="region-map-caption">{labels.noScript}</p>
      </noscript>
    </section>
  );
}
