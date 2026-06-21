import { useMemo, useState } from "react";

export default function BlogCarousel({ posts, tags }) {
  const allTags = Object.keys(tags);
  const [active, setActive] = useState(null); // null = all
  const [index, setIndex] = useState(0);

  const filtered = useMemo(() => {
    const list = active ? posts.filter((p) => p.tags.includes(active)) : posts;
    return list;
  }, [active, posts]);

  const n = filtered.length;
  const angle = n > 0 ? 360 / n : 0;
  // radius scales with card count so they don't overlap
  const radius = Math.max(280, Math.round(150 / Math.tan(Math.PI / Math.max(n, 2))));

  const go = (dir) => setIndex((i) => i + dir);
  const selectTag = (t) => {
    setActive((cur) => (cur === t ? null : t));
    setIndex(0);
  };

  // color of a card = its first tag's color
  const cardColor = (p) => tags[p.tags[0]] || "#c89cfb";

  return (
    <div className="carousel-wrap">
      <div className="tagbar" role="tablist" aria-label="Filter posts by tag">
        <button
          className={"tag" + (active === null ? " on" : "")}
          onClick={() => selectTag(null)}
          style={{ "--tc": "#ece9f5" }}
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
          <div className="stage">
            <div
              className="ring"
              style={{ transform: `translateZ(-${radius}px) rotateY(${-index * angle}deg)` }}
            >
              {filtered.map((p, i) => {
                const rot = i * angle;
                const isFront = ((index % n) + n) % n === i;
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
                    <a className="card-link" href={`/blog/${p.slug}`} tabIndex={isFront ? 0 : -1}>
                      read {p.real ? "" : "(draft)"} →
                    </a>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="controls">
            <button onClick={() => go(-1)} aria-label="Previous post">←</button>
            <span className="counter">
              {(((index % n) + n) % n) + 1} / {n}
            </span>
            <button onClick={() => go(1)} aria-label="Next post">→</button>
          </div>
        </>
      )}

      <style>{`
        .carousel-wrap{--card-w:330px;--card-h:430px}
        .tagbar{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;margin-bottom:2.5rem}
        .tag{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;
          background:transparent;border:1px solid var(--line);color:var(--text-dim);
          padding:.5rem 1rem;border-radius:999px;cursor:pointer;transition:all .25s var(--ease)}
        .tag:hover{border-color:var(--tc);color:var(--tc)}
        .tag.on{border-color:var(--tc);color:#150f1f;background:var(--tc);
          box-shadow:0 0 22px color-mix(in srgb, var(--tc) 55%, transparent)}
        .stage{position:relative;height:var(--card-h);perspective:1400px;margin-inline:auto;max-width:100%}
        .ring{position:absolute;inset:0;margin:auto;width:var(--card-w);height:var(--card-h);
          transform-style:preserve-3d;transition:transform .8s var(--ease)}
        .card{position:absolute;inset:0;width:var(--card-w);height:var(--card-h);
          display:flex;flex-direction:column;gap:.5rem;padding:1.6rem;border-radius:18px;
          background:rgba(38,28,53,.72);backdrop-filter:blur(10px);
          border:1px solid var(--line);overflow:hidden;
          transition:opacity .6s var(--ease),box-shadow .6s var(--ease);opacity:.32;backface-visibility:hidden}
        .card.front{opacity:1;box-shadow:0 0 50px color-mix(in srgb, var(--cc) 30%, transparent)}
        /* per-tag colored top outline */
        .card-top{position:absolute;top:0;left:0;right:0;height:3px;
          background:linear-gradient(90deg, var(--cc), transparent)}
        .card-tags{display:flex;gap:.6rem;font-family:var(--font-mono);font-size:.68rem;
          letter-spacing:.1em;margin-top:.4rem}
        .card h3{font-size:1.5rem;margin:.2rem 0 0}
        .card time{font-family:var(--font-mono);font-size:.7rem;color:var(--text-faint);letter-spacing:.1em}
        .card p{font-size:.92rem;flex:1}
        .card-link{font-family:var(--font-mono);font-size:.78rem;letter-spacing:.1em;
          color:var(--cc);margin-top:auto}
        .controls{display:flex;align-items:center;justify-content:center;gap:1.4rem;margin-top:2.4rem}
        .controls button{width:48px;height:48px;border-radius:50%;border:1px solid var(--line);
          background:rgba(61,61,91,.2);color:var(--text);font-size:1.2rem;cursor:pointer;
          transition:all .2s var(--ease)}
        .controls button:hover{border-color:var(--c-accent);color:var(--c-accent);box-shadow:var(--glow-accent)}
        .counter{font-family:var(--font-mono);font-size:.8rem;color:var(--text-dim);letter-spacing:.2em}
        @media (max-width:600px){.carousel-wrap{--card-w:280px;--card-h:420px}}
      `}</style>
    </div>
  );
}
