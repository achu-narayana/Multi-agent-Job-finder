import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useWidth } from "../charts/useSize";
import type { Startup } from "../data/startups";
import { formatFunding } from "../lib/format";
import { referralWarmth } from "../lib/insights";
import type { Profile } from "../lib/resume";
import { prefersReducedMotion } from "../motion/setup";
import "./Constellation.css";

// Dala-inspired constellation: you at the centre, the people who can refer you
// in between, and the startups they work at on the outer ring. Startups are
// outlined triangles coloured by round (same validated slots as the charts);
// line brightness is referral warmth. Drawn on canvas with a slow ambient drift.

// Colours come from the CSS tokens so the canvas follows the theme.
// Round → slot matches the dashboard's "Rounds by region" chart.
type Palette = Record<"seed" | "a" | "b" | "you" | "person" | "line" | "lineHot" | "label", string>;

function readPalette(el: Element): Palette {
  const css = getComputedStyle(el);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    seed: v("--viz-3", "#2f9e74"),
    a: v("--viz-1", "#dc5000"),
    b: v("--viz-2", "#5b8def"),
    you: v("--text-strong", "#ffedd7"),
    person: v("--text", "#ecdcc6"),
    line: v("--text-muted", "#ad9a84"),
    lineHot: v("--text-strong", "#ffedd7"),
    label: v("--text-muted", "#ad9a84"),
  };
}

const roundSlot = (round: Startup["round"]): "seed" | "a" | "b" =>
  round === "Series A" ? "a" : round === "Series B" || round === "Series C" ? "b" : "seed";

interface Node {
  kind: "you" | "person" | "startup";
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
  label: string;
  detail: string;
  startupId?: string;
  warmth?: number;
  phase: number;
}

interface Edge {
  a: Node;
  b: Node;
  strength: number; // 0–1
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  alpha: number;
}


export function Constellation({ startups, profile }: { startups: Startup[]; profile: Profile | null }) {
  const navigate = useNavigate();
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  // Narrow screens get a taller canvas so the ring has room.
  const height = width < 600 ? Math.round(width * 1.35) : 380;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Node | null>(null);
  const hoverRef = useRef<Node | null>(null);
  hoverRef.current = hover;

  const { nodes, edges } = useMemo(() => {
    const cx = width / 2;
    const cy = height / 2;
    const rx = Math.max(110, width / 2 - (width < 600 ? 70 : 120));
    const ry = height / 2 - 34;
    const you: Node = { kind: "you", id: "you", x: cx, y: cy, r: 7, color: "you", label: profile?.name ?? "You", detail: profile ? profile.headline : "Upload your résumé", phase: 0 };
    const nodes: Node[] = [you];
    const edges: Edge[] = [];
    const sorted = [...startups].sort((a, b) => a.region.localeCompare(b.region) || b.amountUsd - a.amountUsd);
    sorted.forEach((s, i) => {
      const angle = (i / sorted.length) * Math.PI * 2 - Math.PI / 2;
      const node: Node = {
        kind: "startup",
        id: s.id,
        startupId: s.id,
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
        r: 5 + Math.min(7, Math.sqrt(s.amountUsd / 1_000_000)),
        color: roundSlot(s.round),
        label: s.name,
        detail: `${formatFunding(s, s.amountUsd)} ${s.round} · ${s.city}`,
        phase: i * 1.7,
      };
      nodes.push(node);
      s.people.forEach((p, j) => {
        const w = referralWarmth(p, profile).score / 100;
        // Warmer contacts sit closer to you.
        const t = 0.32 + (1 - w) * 0.42;
        const spread = (j - (s.people.length - 1) / 2) * 0.07;
        const pa = angle + spread;
        const person: Node = {
          kind: "person",
          id: p.id,
          startupId: s.id,
          x: cx + Math.cos(pa) * rx * t,
          y: cy + Math.sin(pa) * ry * t,
          r: 2 + w * 2.5,
          color: "person",
          label: p.name,
          detail: `${p.title} at ${s.name} · warmth ${Math.round(w * 100)}`,
          warmth: w,
          phase: i * 1.7 + j,
        };
        nodes.push(person);
        edges.push({ a: you, b: person, strength: w });
        edges.push({ a: person, b: node, strength: 0.25 + w * 0.35 });
      });
    });
    return { nodes, edges };
  }, [startups, profile, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pal = readPalette(canvas);
    const particleColors = [pal.a, pal.b, pal.seed, pal.label, pal.label];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reduced = prefersReducedMotion();
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const particles: Particle[] = Array.from({ length: Math.round((width * height) / 4200) }, () => ({
      x: rand() * width,
      y: rand() * height,
      vx: (rand() - 0.5) * 0.12,
      vy: (rand() - 0.5) * 0.12,
      size: 1.5 + rand() * 2.5,
      rot: rand() * Math.PI * 2,
      vr: (rand() - 0.5) * 0.004,
      color: particleColors[Math.floor(rand() * particleColors.length)],
      alpha: 0.12 + rand() * 0.22,
    }));

    const triangle = (x: number, y: number, size: number, rot: number) => {
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = rot + (k * Math.PI * 2) / 3 - Math.PI / 2;
        const px = x + Math.cos(a) * size;
        const py = y + Math.sin(a) * size;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    let raf = 0;
    const started = performance.now();

    const draw = (now: number) => {
      const t = (now - started) / 1000;
      const intro = reduced ? 1 : Math.min(1, t / 1.4);
      const ease = 1 - Math.pow(1 - intro, 3);
      const hovered = hoverRef.current;
      ctx.clearRect(0, 0, width, height);

      // Ambient field
      for (const p of particles) {
        if (!reduced) {
          p.x = (p.x + p.vx + width) % width;
          p.y = (p.y + p.vy + height) % height;
          p.rot += p.vr;
        }
        ctx.globalAlpha = p.alpha * ease;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        triangle(p.x, p.y, p.size, p.rot);
        ctx.stroke();
      }

      const wob = (n: Node) => (reduced || n.kind === "you" ? [0, 0] : [Math.sin(t * 0.6 + n.phase) * 2.2, Math.cos(t * 0.5 + n.phase) * 2.2]);
      const pos = (n: Node) => {
        const [dx, dy] = wob(n);
        const cx = width / 2;
        const cy = height / 2;
        return [cx + (n.x - cx) * ease + dx, cy + (n.y - cy) * ease + dy];
      };

      // Edges
      for (const e of edges) {
        const related = hovered && (hovered.id === e.a.id || hovered.id === e.b.id || (hovered.startupId && hovered.startupId === e.b.startupId));
        const [ax, ay] = pos(e.a);
        const [bx, by] = pos(e.b);
        ctx.globalAlpha = (hovered ? (related ? 0.85 : 0.05) : 0.08 + e.strength * 0.38) * ease;
        ctx.strokeStyle = related ? pal.lineHot : pal.line;
        ctx.lineWidth = related ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      // Nodes
      for (const n of nodes) {
        const [x, y] = pos(n);
        const dim = hovered && hovered.id !== n.id && hovered.startupId !== n.startupId && n.kind !== "you";
        ctx.globalAlpha = (dim ? 0.3 : 1) * ease;
        if (n.kind === "startup") {
          const c = pal[n.color as keyof Palette];
          ctx.strokeStyle = c;
          ctx.lineWidth = 1.6;
          triangle(x, y, n.r + 3, reduced ? 0 : Math.sin(t * 0.3 + n.phase) * 0.15);
          ctx.stroke();
          ctx.globalAlpha *= 0.22;
          ctx.fillStyle = c;
          ctx.fill();
        } else if (n.kind === "person") {
          ctx.fillStyle = pal.person;
          ctx.globalAlpha *= 0.35 + (n.warmth ?? 0) * 0.65;
          ctx.beginPath();
          ctx.arc(x, y, n.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const pulse = reduced ? 0 : (Math.sin(t * 2) + 1) / 2;
          ctx.globalAlpha = 0.18 * ease;
          ctx.fillStyle = pal.you;
          ctx.beginPath();
          ctx.arc(x, y, n.r + 6 + pulse * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = ease;
          ctx.beginPath();
          ctx.arc(x, y, n.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Startup labels (always visible — identity never relies on hover)
      ctx.globalAlpha = ease;
      ctx.font = `500 10px "Hanken Grotesk Variable", system-ui, sans-serif`;
      ctx.fillStyle = pal.label;
      const placed: [number, number, number, number][] = [];
      for (const n of nodes) {
        if (n.kind !== "startup") continue;
        const [x, y] = pos(n);
        const gap = n.r + 8;
        const text = n.label.toUpperCase();
        const w = ctx.measureText(text).width;
        // Label points outward, but flips inward if it would run off the canvas.
        let right = x >= width / 2;
        if (right && x + gap + w > width - 4) right = false;
        if (!right && x - gap - w < 4) right = true;
        // Skip a label that would collide with one already drawn (tap/hover and the table still name it).
        const lx = right ? x + gap : x - gap - w;
        const rect: [number, number, number, number] = [lx - 2, y - 8, lx + w + 2, y + 6];
        if (placed.some((r) => rect[0] < r[2] && rect[2] > r[0] && rect[1] < r[3] && rect[3] > r[1])) continue;
        placed.push(rect);
        ctx.textAlign = right ? "left" : "right";
        ctx.fillText(text, x + (right ? gap : -gap), y + 4);
      }
      ctx.globalAlpha = 1;

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [nodes, edges, width, height]);

  function pick(clientX: number, clientY: number): Node | null {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: Node | null = null;
    let bestD = 18; // generous hit radius
    for (const n of nodes) {
      const d = Math.hypot(n.x - x, n.y - y) - n.r;
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  return (
    <div className="constellation" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        style={{ width, height, cursor: hover?.startupId ? "pointer" : "default" }}
        role="img"
        aria-label="Referral constellation: you, the people who can refer you, and the startups they work at"
        onPointerMove={(e) => setHover(pick(e.clientX, e.clientY))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => {
          const n = pick(e.clientX, e.clientY);
          if (!n?.startupId) return;
          navigate(n.kind === "person" ? `/startups/${n.startupId}?compose=${n.id}` : `/startups/${n.startupId}`);
        }}
      />
      {hover && (
        <div
          className="chart-tooltip constellation-tip"
          style={{ left: Math.min(width - 200, Math.max(0, hover.x + 14)), top: Math.max(0, hover.y - 10) }}
        >
          <div className="tt-row">
            <strong>{hover.label}</strong>
          </div>
          <div className="tt-title">{hover.detail}</div>
          {hover.startupId && <div className="tt-title">{hover.kind === "person" ? "Click to write an email" : "Click to open"}</div>}
        </div>
      )}
    </div>
  );
}
