/**
 * OpenDive Atlas mark: a school of fish swimming in the shape of a map pin,
 * with a long-spined squirrelfish at its centre. Geometry is computed once at
 * module load so the SVG is static markup.
 */
const FISH = "M-6 0C-3-3 3-3 6 0 3 3-3 3-6 0ZM-6 0-10-3-9 0-10 3Z";
const SHADES = ["#5cc3f0", "#3aa6dc", "#1f7fbf", "#8ad6f5", "#2b93cf"];

function pinPoints(n: number) {
  const pts: { x: number; y: number; ang: number }[] = [];
  const cx = 60, cy = 56, r = 40;
  const a0 = Math.PI * 0.78, a1 = Math.PI * 2.22;
  const arcN = Math.round(n * 0.7);
  for (let i = 0; i < arcN; i++) {
    const a = a0 + ((a1 - a0) * i) / (arcN - 1);
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), ang: a + Math.PI / 2 });
  }
  const left = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
  const right = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) };
  const tip = { x: 60, y: 140 };
  const rest = n - arcN, half = Math.ceil(rest / 2);
  for (let j = 1; j <= half; j++) {
    const u = j / (half + 1);
    pts.push({ x: left.x + (tip.x - left.x) * u, y: left.y + (tip.y - left.y) * u, ang: Math.atan2(tip.y - left.y, tip.x - left.x) });
  }
  for (let k = 1; k <= rest - half; k++) {
    const v = k / (rest - half + 1);
    pts.push({ x: tip.x + (right.x - tip.x) * v, y: tip.y + (right.y - tip.y) * v, ang: Math.atan2(right.y - tip.y, right.x - tip.x) });
  }
  return pts;
}

const SCHOOL = pinPoints(34).map((p, i) => ({
  fill: SHADES[i % SHADES.length],
  transform: `translate(${(p.x + ((i * 53) % 7) - 3).toFixed(1)} ${(p.y + ((i * 29) % 7) - 3).toFixed(1)}) rotate(${((p.ang * 180) / Math.PI).toFixed(0)}) scale(${(0.75 + ((i * 37) % 10) / 22).toFixed(2)})`,
}));

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 150" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {SCHOOL.map((f, i) => (
        <path key={i} d={FISH} fill={f.fill} transform={f.transform} />
      ))}
      <g transform="translate(60 58)">
        <path d="M-14-1-11-9-8-3-5-11-2-4 1-11 4-4 7-10 9-3" fill="none" stroke="#f79a6b" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M-17 0C-12-8 8-9 17 0 8 8-12 8-17 0Z" fill="#ef6a3a" />
        <path d="M-16 0-24-7-21 0-24 7Z" fill="#ef6a3a" />
        <circle cx="10" cy="-1" r="3.4" fill="#fff6ea" />
        <circle cx="10.6" cy="-1" r="1.8" fill="#0d1129" />
      </g>
    </svg>
  );
}
