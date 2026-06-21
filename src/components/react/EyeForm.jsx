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

export default function EyeForm() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onMove = (e) => setPointer({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", (e) =>
      e.touches[0] && setPointer({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    );
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    // no backend wired yet — acknowledge locally
    setSent(true);
  };

  return (
    <div className="eyeform">
      <div className="eyes" aria-hidden="true">
        <Eye pointer={pointer} />
        <Eye pointer={pointer} />
      </div>

      {sent ? (
        <p className="sent">
          // transmission received. I see you. <br />
          <span>(placeholder — no backend is wired yet)</span>
        </p>
      ) : (
        <form onSubmit={submit}>
          <label>
            <span>name</span>
            <input type="text" name="name" autoComplete="name" required />
          </label>
          <label>
            <span>signal (email)</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            <span>message</span>
            <textarea name="message" rows={4} required></textarea>
          </label>
          <button type="submit">transmit →</button>
        </form>
      )}

      <style>{`
        .eyeform{display:grid;gap:2rem;max-width:520px}
        .eyes{display:flex;gap:2.4rem;justify-content:center}
        .eye{width:84px;height:84px;border-radius:50%;background:radial-gradient(circle at 50% 40%, #3d3d5b, #150f1f);
          border:1px solid var(--line);display:grid;place-items:center;
          box-shadow:inset 0 0 24px rgba(0,0,0,.6), var(--glow)}
        .pupil{width:30px;height:30px;border-radius:50%;
          background:radial-gradient(circle at 40% 35%, #63cfb7, #be6de6);
          box-shadow:0 0 16px rgba(99,207,183,.8);transition:transform .08s linear}
        form{display:grid;gap:1.2rem}
        label{display:grid;gap:.4rem}
        label span{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.2em;
          text-transform:uppercase;color:var(--c-accent)}
        input,textarea{background:rgba(38,28,53,.6);border:1px solid var(--line);border-radius:10px;
          padding:.8rem 1rem;color:var(--text);font-family:var(--font-ui);font-size:.95rem;
          transition:border-color .2s var(--ease),box-shadow .2s var(--ease)}
        input:focus,textarea:focus{outline:none;border-color:var(--c-primary);box-shadow:var(--glow)}
        button{justify-self:start;font-family:var(--font-mono);letter-spacing:.16em;text-transform:uppercase;
          font-size:.78rem;padding:.8rem 1.6rem;border-radius:999px;cursor:pointer;color:#150f1f;
          background:linear-gradient(120deg,var(--c-primary),var(--c-accent));border:0;
          transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
        button:hover{transform:translateY(-2px);box-shadow:var(--glow)}
        .sent{font-family:var(--font-mono);color:var(--c-accent);font-size:1rem;line-height:1.8}
        .sent span{color:var(--text-faint);font-size:.78rem}
      `}</style>
    </div>
  );
}
