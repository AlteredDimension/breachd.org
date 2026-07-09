import { useMemo, useState, useRef, useEffect } from "react";

export default function BlogCarousel({ posts, tags }) {
  const allTags = Object.keys(tags);
  const [active, setActive] = useState(null); // null = all
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(null); // open post (modal) or null
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

  const filtered = useMemo(
    () => (active ? posts.filter((p) => p.tags.includes(active)) : posts),
    [active, posts]
  );

  const n = filtered.length;
  const angle = n > 0 ? 360 / n : 0;
  // 40% larger cards than before (was 330x430)
  const radius = Math.max(400, Math.round(232 / Math.tan(Math.PI / Math.max(n, 2))));
  const current = ((index % n) + n) % n;

  const go = (dir) => setIndex((i) => i + dir);
  const selectTag = (t) => {
    setActive((cur) => (cur === t ? null : t));
    setIndex(0);
  };
  const cardColor = (p) => tags[p.tags[0]] || "#c89cfb";

  // faint tilt of the front card based on cursor position over the stage
  const onStageMove = (e) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    setTilt({ x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  // lock the page behind the modal; allow internal scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // click a side card -> bring to front; click the front card -> open it
  const onCardClick = (i, p) => {
    if (i === current) setOpen(p);
    else setIndex((idx) => idx + (i - current));
  };

  return (
    <div className="carousel-wrap">
      <div className="tagbar" role="tablist" aria-label="Filter posts by tag">
        <button
          className={"tag" + (active === null ? " on" : "")}
          onClick={() => selectTag(null)}
          style={{ "--tc": "var(--text)" }}
        >
          all
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            className={"tag" + (active === t ? " on" : "")}
            onClick={() => selectTag(t)}
            style={{ "--tc": tags[t] }}
          >
            {t}
          </button>
        ))}
      </div>

      {n === 0 ? (
        <p className="placeholder">No posts under “{active}” yet.</p>
      ) : (
        <>
          <div className="stage" ref={stageRef} onMouseMove={onStageMove} onMouseLeave={resetTilt}>
            <div
              className="ring"
              style={{ transform: `translateZ(-${radius}px) rotateY(${-index * angle}deg)` }}
            >
              {filtered.map((p, i) => {
                const rot = i * angle;
                const isFront = current === i;
                return (
                  <article
                    key={p.slug}
                    className={"card" + (isFront ? " front" : "")}
                    style={{
                      transform: `rotateY(${rot}deg) translateZ(${radius}px)`,
                      "--cc": cardColor(p),
                    }}
                    aria-hidden={!isFront}
                  >
                    <button
                      className="card-hit"
                      onClick={() => onCardClick(i, p)}
                      tabIndex={isFront ? 0 : -1}
                      aria-label={isFront ? `Open ${p.title}` : `Bring ${p.title} to front`}
                    >
                      <div
                        className="card-inner"
                        style={
                          isFront
                            ? { transform: `rotateY(${tilt.x * 6}deg) rotateX(${-tilt.y * 6}deg)` }
                            : undefined
                        }
                      >
                        <div className="card-top" />
                        <div className="card-tags">
                          {p.tags.map((t) => (
                            <span key={t} style={{ color: tags[t] }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                        <h3>{p.title}</h3>
                        <time>{p.date}</time>
                        <p>{p.excerpt}</p>
                        <span className="card-link">
                          read {p.real ? "" : "(draft)"} →
                        </span>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="controls">
            <button onClick={() => go(-1)} aria-label="Previous post">←</button>
            <span className="counter">{current + 1} / {n}</span>
            <button onClick={() => go(1)} aria-label="Next post">→</button>
          </div>
        </>
      )}

      {/* full post hovers over the page; scrolls internally while the page stays put */}
      {open && (
        <div className="post-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <article className="post-modal" style={{ "--cc": cardColor(open) }}>
            <button className="post-close" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            <div className="post-scroll">
              <div className="post-tags">
                {open.tags.map((t) => (
                  <span key={t} style={{ color: tags[t] }}>#{t}</span>
                ))}
              </div>
              <h2>
                {/* title links to the post's own static route (/blog/<slug>) */}
                <a className="post-title-link" href={`/blog/${open.slug}`}>
                  {open.title}
                </a>
              </h2>
              <time>{open.date}</time>
              {!open.real && <p className="draft-note">draft — placeholder copy</p>}
              <div className="post-body">
                {open.body.map((para, k) => (
                  <p key={k}>{para}</p>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}

      <style>{`
        .carousel-wrap{--card-w:462px;--card-h:602px}
        .tagbar{position:relative;z-index:3;display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;margin-bottom:2rem}
        .tag{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;
          background:transparent;border:1px solid var(--line);color:var(--text-dim);
          padding:.5rem 1rem;border-radius:999px;cursor:pointer;transition:all .25s var(--ease)}
        .tag:hover{border-color:var(--tc);color:var(--tc)}
        .tag.on{border-color:var(--tc);color:var(--bg-void);background:var(--tc);
          box-shadow:0 0 22px color-mix(in srgb, var(--tc) 55%, transparent)}
        .stage{position:relative;z-index:1;height:var(--card-h);perspective:1700px;margin-inline:auto;max-width:100%}
        .ring{position:absolute;inset:0;margin:auto;width:var(--card-w);height:var(--card-h);
          transform-style:preserve-3d;transition:transform .8s var(--ease)}
        .card{position:absolute;inset:0;width:var(--card-w);height:var(--card-h);backface-visibility:hidden}
        .card-hit{display:block;width:100%;height:100%;padding:0;border:0;background:none;cursor:pointer;
          transform-style:preserve-3d}
        .card-inner{display:flex;flex-direction:column;gap:.55rem;height:100%;text-align:left;
          padding:2rem;border-radius:20px;background:color-mix(in srgb, var(--bg-dark) 72%, transparent);
          backdrop-filter:blur(10px);border:1px solid var(--line);overflow:hidden;
          opacity:.32;transition:opacity .6s var(--ease),box-shadow .3s var(--ease),transform .15s var(--ease)}
        .card.front .card-inner{opacity:1;box-shadow:0 0 60px color-mix(in srgb, var(--cc) 30%, transparent)}
        .card.front .card-hit:hover .card-inner{box-shadow:0 0 80px color-mix(in srgb, var(--cc) 45%, transparent)}
        .card-top{position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg, var(--cc), transparent)}
        .card-tags{display:flex;gap:.6rem;font-family:var(--font-mono);font-size:.72rem;
          letter-spacing:.1em;margin-top:.4rem}
        .card-inner h3{font-size:1.9rem;margin:.3rem 0 0;color:var(--text)}
        .card-inner time{font-family:var(--font-mono);font-size:.74rem;color:var(--text-faint);letter-spacing:.1em}
        .card-inner p{font-size:1rem;flex:1;color:var(--text-dim)}
        /* read button -> bottom-right corner, no underline */
        .card-link{align-self:flex-end;margin-top:auto;font-family:var(--font-mono);font-size:.82rem;
          letter-spacing:.1em;color:var(--cc);text-decoration:none}
        .controls{position:relative;z-index:3;display:flex;align-items:center;justify-content:center;gap:1.4rem;margin-top:2rem}
        .controls button{width:48px;height:48px;border-radius:50%;border:1px solid var(--line);
          background:color-mix(in srgb, var(--bg-lighter) 30%, transparent);color:var(--text);
          font-size:1.2rem;cursor:pointer;transition:all .2s var(--ease)}
        .controls button:hover{border-color:var(--c-accent);color:var(--c-accent);box-shadow:var(--glow-accent)}
        .counter{font-family:var(--font-mono);font-size:.8rem;color:var(--text-dim);letter-spacing:.2em}

        .post-overlay{position:fixed;inset:0;z-index:500;display:grid;place-items:center;padding:5vh 5vw;
          background:rgba(13,9,21,.74);backdrop-filter:blur(10px);animation:fade .3s var(--ease)}
        .post-modal{position:relative;width:min(760px,100%);max-height:88vh;border-radius:20px;
          background:color-mix(in srgb, var(--bg-dark) 94%, transparent);
          border:1px solid var(--line);box-shadow:0 0 80px color-mix(in srgb, var(--cc) 35%, transparent);
          overflow:hidden;animation:rise .4s var(--ease)}
        .post-modal::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg, var(--cc), transparent)}
        .post-close{position:absolute;top:1rem;right:1rem;z-index:2;width:40px;height:40px;border-radius:50%;
          border:1px solid var(--line);background:color-mix(in srgb, var(--bg-void) 50%, transparent);
          color:var(--text);cursor:pointer;font-size:.9rem}
        .post-close:hover{border-color:var(--c-accent);color:var(--c-accent)}
        .post-scroll{max-height:88vh;overflow-y:auto;padding:3rem clamp(1.6rem,4vw,3rem)}
        .post-tags{display:flex;gap:.8rem;font-family:var(--font-mono);font-size:.72rem;letter-spacing:.1em}
        .post-modal h2{font-size:clamp(1.8rem,4vw,2.8rem);margin:.8rem 0 .2rem}
        .post-title-link{color:inherit;text-decoration:none;transition:color .2s var(--ease)}
        .post-title-link:hover,.post-title-link:focus-visible{color:var(--cc)}
        .post-modal time{font-family:var(--font-mono);font-size:.74rem;color:var(--text-faint);letter-spacing:.1em}
        .draft-note{font-family:var(--font-mono);font-size:.74rem;color:var(--text-faint)}
        .post-body{margin-top:1.8rem}
        .post-body p{font-size:1.06rem;line-height:1.8;color:var(--text-dim);margin-bottom:1.4rem}
        @keyframes fade{from{opacity:0}to{opacity:1}}
        @keyframes rise{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}

        @media (max-width:600px){.carousel-wrap{--card-w:300px;--card-h:460px}.card-inner h3{font-size:1.5rem}}
      `}</style>
    </div>
  );
}
