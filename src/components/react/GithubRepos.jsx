import { useEffect, useState } from "react";

const USER = "altereddimension";

export default function GithubRepos() {
  const [state, setState] = useState({ status: "loading", repos: [], langs: [] });

  useEffect(() => {
    let alive = true;
    fetch(`https://api.github.com/users/${USER}/repos?sort=updated&per_page=100`)
      .then((r) => {
        if (!r.ok) throw new Error(`github ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!alive) return;
        const repos = data
          .filter((r) => !r.fork)
          .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
          .slice(0, 12);
        // aggregate primary languages (cheap — no per-repo calls)
        const counts = {};
        for (const r of data) if (r.language) counts[r.language] = (counts[r.language] || 0) + 1;
        const langs = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        setState({ status: "ok", repos, langs });
      })
      .catch((e) => alive && setState({ status: "error", error: e.message, repos: [], langs: [] }));
    return () => {
      alive = false;
    };
  }, []);

  const maxLang = state.langs[0]?.count || 1;

  return (
    <section class="gh">
      <div className="gh-head">
        <p className="eyebrow">// version control</p>
        <h2>From the forge</h2>
        <a className="gh-profile" href={`https://github.com/${USER}`} target="_blank" rel="noreferrer">
          @{USER} on github →
        </a>
      </div>

      {state.status === "loading" && <p className="gh-note">// pulling repositories…</p>}
      {state.status === "error" && (
        <p className="gh-note">
          // couldn't reach github ({state.error}). It may be rate-limited — try again shortly.
        </p>
      )}

      {state.status === "ok" && (
        <div className="gh-grid">
          <ul className="repos">
            {state.repos.map((r) => (
              <li key={r.id}>
                <a href={r.html_url} target="_blank" rel="noreferrer">
                  <div className="repo-top">
                    <span className="repo-name">{r.name}</span>
                    <span className="repo-stars">★ {r.stargazers_count}</span>
                  </div>
                  <p className="repo-desc">{r.description || "—"}</p>
                  <div className="repo-meta">
                    {r.language && <span className="repo-lang">{r.language}</span>}
                    <span className="repo-updated">
                      updated {new Date(r.pushed_at).toISOString().slice(0, 10)}
                    </span>
                  </div>
                </a>
              </li>
            ))}
            {state.repos.length === 0 && <li className="gh-note">// no public repos yet.</li>}
          </ul>

          <aside className="langs">
            <h3>Languages used</h3>
            {state.langs.length === 0 && <p className="gh-note">// none detected.</p>}
            {state.langs.map((l) => (
              <div className="lang" key={l.name}>
                <div className="lang-label">
                  <span>{l.name}</span>
                  <span>{l.count}</span>
                </div>
                <div className="lang-bar">
                  <span style={{ width: `${(l.count / maxLang) * 100}%` }} />
                </div>
              </div>
            ))}
          </aside>
        </div>
      )}

      <style>{`
        .gh{margin-top:5rem;border-top:1px solid var(--line);padding-top:3rem}
        .gh-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:.6rem 1.4rem;margin-bottom:2rem}
        .gh-head h2{font-size:clamp(1.6rem,4vw,2.6rem);margin:0}
        .gh a{text-decoration:none}
        .gh-profile{font-family:var(--font-mono);font-size:.76rem;letter-spacing:.12em;margin-left:auto}
        .gh-note{font-family:var(--font-mono);font-size:.82rem;color:var(--text-faint)}
        .gh-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:2rem;align-items:start}
        .repos{list-style:none;margin:0;padding:0;display:grid;gap:1rem}
        .repos a{display:block;padding:1.2rem 1.4rem;border-radius:14px;border:1px solid var(--line);
          background:color-mix(in srgb, var(--bg-dark) 45%, transparent);color:var(--text);
          transition:transform .25s var(--ease),border-color .25s var(--ease)}
        .repos a:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--c-primary) 50%,transparent)}
        .repo-top{display:flex;justify-content:space-between;align-items:center;gap:1rem}
        .repo-name{font-family:var(--font-display);font-size:1.15rem;color:var(--c-primary)}
        .repo-stars{font-family:var(--font-mono);font-size:.74rem;color:var(--text-faint)}
        .repo-desc{margin:.5rem 0 .8rem;font-size:.9rem;color:var(--text-dim)}
        .repo-meta{display:flex;gap:1rem;font-family:var(--font-mono);font-size:.7rem;
          letter-spacing:.08em;color:var(--text-faint)}
        .repo-lang{color:var(--c-accent)}
        .langs{position:sticky;top:calc(var(--nav-h) + 1rem);padding:1.4rem 1.6rem;border-radius:16px;
          border:1px solid var(--line);background:color-mix(in srgb, var(--bg-dark) 40%, transparent)}
        .langs h3{font-size:1.1rem;margin:0 0 1.2rem;color:var(--text)}
        .lang{margin-bottom:1rem}
        .lang-label{display:flex;justify-content:space-between;font-family:var(--font-mono);
          font-size:.74rem;color:var(--text-dim);margin-bottom:.35rem;letter-spacing:.06em}
        .lang-bar{height:6px;border-radius:999px;background:color-mix(in srgb,var(--bg-lighter) 40%,transparent);overflow:hidden}
        .lang-bar span{display:block;height:100%;border-radius:999px;
          background:linear-gradient(90deg,var(--c-primary),var(--c-accent))}
        @media (max-width:760px){.gh-grid{grid-template-columns:1fr}.langs{position:static}}
      `}</style>
    </section>
  );
}
