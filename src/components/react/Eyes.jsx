import { useEffect, useRef, useState } from "react";

function Eye({ pointer }) {
  const ref = useRef(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const a = Math.atan2(dy, dx);
    const dist = Math.min(Math.hypot(dx, dy) / 18, r.width * 0.22);
    setPupil({ x: Math.cos(a) * dist, y: Math.sin(a) * dist });
  }, [pointer]);
  return (
    <div className="eye" ref={ref}>
      <div className="pupil" style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)` }} />
    </div>
  );
}

export default function Eyes() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => setPointer({ x: e.clientX, y: e.clientY });
    const onTouch = (e) =>
      e.touches[0] && setPointer({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <div className="eyes" aria-hidden="true">
      <Eye pointer={pointer} />
      <Eye pointer={pointer} />
      <style>{`
        .eyes{display:flex;gap:2.4rem}
        .eye{width:84px;height:84px;border-radius:50%;
          background:radial-gradient(circle at 50% 40%, var(--bg-lighter), var(--bg-void));
          border:1px solid var(--line);display:grid;place-items:center;
          box-shadow:inset 0 0 24px rgba(0,0,0,.4), var(--glow)}
        .pupil{width:30px;height:30px;border-radius:50%;
          background:radial-gradient(circle at 40% 35%, var(--c-accent), var(--c-tertiary));
          box-shadow:0 0 16px rgba(99,207,183,.7);transition:transform .08s linear}
      `}</style>
    </div>
  );
}
