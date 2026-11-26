'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GuideMapData, MapPin } from '../../lib/guides/mapdata';

// Apple MapKit JS, loaded only when the map scrolls into view (plan F1.4). Pins and routes are
// computed on the server; this component only draws them. Token: /api/mapkit-token.
declare global {
  interface Window { mapkit?: any; __tripshareMapKitReady?: () => void }
}

const STAY_COLOR = '#3B82F6';
const MINI_COLOR = '#FF5C38';
let loading: Promise<any> | null = null;

function loadMapKit(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  loading ??= new Promise((resolve, reject) => {
    window.__tripshareMapKitReady = () => {
      window.mapkit.init({
        authorizationCallback: (done: (token: string) => void) => {
          fetch('/api/mapkit-token').then(r => (r.ok ? r.text() : Promise.reject(new Error(`token ${r.status}`)))).then(done).catch(reject);
        },
      });
      resolve(window.mapkit);
    };
    const s = document.createElement('script');
    s.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js';
    s.crossOrigin = 'anonymous';
    s.async = true;
    s.dataset.callback = '__tripshareMapKitReady';
    s.dataset.libraries = 'map,annotations,overlays';
    s.onerror = () => { loading = null; reject(new Error('MapKit JS failed to load')); };
    document.head.appendChild(s);
  });
  return loading;
}

function pinElement(pin: MapPin, color: string): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `width:30px;height:30px;border-radius:50%;background:${color};border:2px solid #fff;` +
    'display:flex;align-items:center;justify-content:center;color:#fff;font:700 13px/1 system-ui,sans-serif;' +
    'box-shadow:0 2px 6px rgba(0,0,0,.45);cursor:pointer';
  if (pin.kind === 'stay') {
    el.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>';
  } else {
    el.textContent = pin.label;
  }
  return el;
}

type Props = {
  data: GuideMapData;
  mini?: boolean;
  labels: { all: string; empty: string; error: string };
};

export default function GuideMap({ data, mini = false, labels }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const itemsRef = useRef<{ annotations: any[]; overlays: any[] }>({ annotations: [], overlays: [] });
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const colorOf = useMemo(() => {
    const byGroup = new Map(data.groups.map(g => [g.group, g.color]));
    return (pin: MapPin) => (mini ? MINI_COLOR : pin.kind === 'stay' ? STAY_COLOR : byGroup.get(pin.group) ?? MINI_COLOR);
  }, [data.groups, mini]);

  const hasContent = data.pins.length > 0 || !!data.center;
  const dayGroups = data.groups.filter(g => g.kind === 'day');
  const showFilter = !mini && dayGroups.length >= 2;

  // Load MapKit only when the map is about to be seen.
  useEffect(() => {
    if (!hasContent || !box.current) return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: '300px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, [hasContent]);

  useEffect(() => {
    if (!visible || !box.current) return;
    let cancelled = false;
    loadMapKit().then(mapkit => {
      if (cancelled || !box.current) return;
      const map = new mapkit.Map(box.current, {
        colorScheme: mapkit.Map.ColorSchemes.Dark,
        showsMapTypeControl: false,
        showsCompass: mapkit.FeatureVisibility.Hidden,
        isRotationEnabled: false,
      });
      mapRef.current = map;
      const annotations = data.pins.map(pin => new mapkit.Annotation(
        new mapkit.Coordinate(pin.lat, pin.lng),
        () => pinElement(pin, colorOf(pin)),
        { title: pin.title, subtitle: pin.subtitle, data: { group: pin.group, kind: pin.kind }, calloutEnabled: !!pin.title },
      ));
      const color = new Map(data.groups.map(g => [g.group, g.color]));
      const overlays = mini ? [] : data.lines.map(line => {
        const o = new mapkit.PolylineOverlay(
          line.coords.map(([lat, lng]) => new mapkit.Coordinate(lat, lng)),
          { style: new mapkit.Style({ strokeColor: color.get(line.group) ?? MINI_COLOR, lineWidth: 3, lineDash: line.dashed ? [8, 6] : [], lineCap: 'round', lineJoin: 'round' }) },
        );
        o.data = { group: line.group };
        return o;
      });
      map.addAnnotations(annotations);
      map.addOverlays(overlays);
      itemsRef.current = { annotations, overlays };
      if (annotations.length) fit(mapkit, map, annotations, overlays);
      else if (data.center) map.region = new mapkit.CoordinateRegion(new mapkit.Coordinate(...data.center), new mapkit.CoordinateSpan(0.15, 0.15));
    }).catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; mapRef.current?.destroy?.(); mapRef.current = null; };
  }, [visible, data, mini, colorOf]);

  // Day filter: the chosen day's pins and route only (no sections or stays), zoomed to it.
  useEffect(() => {
    const map = mapRef.current;
    const mapkit = typeof window !== 'undefined' ? window.mapkit : null;
    if (!map || !mapkit) return;
    const { annotations, overlays } = itemsRef.current;
    const show = (item: any) => active === null || item.data?.group === active;
    annotations.forEach(a => { a.visible = show(a); });
    overlays.forEach(o => { o.visible = show(o); });
    fit(mapkit, map, annotations.filter(show), overlays.filter(show));
  }, [active]);

  if (!hasContent) return <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">{labels.empty}</p>;

  return (
    <div>
      {showFilter && (
        <div className="mb-3 flex flex-wrap gap-2">
          <FilterButton on={active === null} color="#F5F1EE" onClick={() => setActive(null)}>{labels.all}</FilterButton>
          {dayGroups.map(g => (
            <FilterButton key={g.group} on={active === g.group} color={g.color} onClick={() => setActive(active === g.group ? null : g.group)}>
              {g.label}
            </FilterButton>
          ))}
        </div>
      )}
      <div
        ref={box}
        className={`w-full overflow-hidden rounded-2xl border border-border bg-s2 ${mini ? 'h-[260px]' : 'h-[360px] lg:h-[calc(100vh-11rem)]'}`}
      >
        {failed && <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">{labels.error}</p>}
      </div>
    </div>
  );
}

function fit(mapkit: any, map: any, annotations: any[], overlays: any[]) {
  const items = [...annotations, ...overlays];
  if (annotations.length === 1 && overlays.length === 0) {
    map.region = new mapkit.CoordinateRegion(annotations[0].coordinate, new mapkit.CoordinateSpan(0.02, 0.02));
  } else if (items.length) {
    map.showItems(items, { animate: true, padding: new mapkit.Padding(48, 48, 48, 48) });
  }
}

function FilterButton({ on, color, onClick, children }: { on: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        on ? 'border-ink/40 bg-ink/10 text-ink' : 'border-border text-muted hover:text-ink'
      }`}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {children}
    </button>
  );
}
