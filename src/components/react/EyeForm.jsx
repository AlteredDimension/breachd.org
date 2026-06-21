import { useState } from "react";

export default function EyeForm() {
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // no backend wired yet — acknowledge locally
    setSent(true);
  };

  // Enter submits (even from the textarea); Shift+Enter inserts a newline
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="eyeform">
      {sent ? (
        <p className="sent">
          // transmission received. I see you. <br />
          <span>(placeholder — no backend is wired yet)</span>
        </p>
      ) : (
        <form onSubmit={submit}>
          <label>
            <span>name <i className="req">*</i></span>
            <input type="text" name="name" autoComplete="name" required onKeyDown={onKeyDown} />
          </label>
          <label>
            <span>signal (email) <i className="req">*</i></span>
            <input type="email" name="email" autoComplete="email" required onKeyDown={onKeyDown} />
          </label>
          <label>
            <span>message</span>
            <textarea name="message" rows={4} onKeyDown={onKeyDown}></textarea>
          </label>
          <button type="submit">transmit →</button>
          <p className="hint">enter to transmit · shift + enter for a new line</p>
        </form>
      )}

      <style>{`
        .eyeform{display:grid;gap:2rem;max-width:520px}
        form{display:grid;gap:1.2rem}
        label{display:grid;gap:.4rem}
        label span{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.2em;
          text-transform:uppercase;color:var(--c-accent)}
        .req{color:var(--c-tertiary);font-style:normal;font-weight:700}
        input,textarea{background:color-mix(in srgb, var(--bg-dark) 60%, transparent);
          border:1px solid var(--line);border-radius:10px;
          padding:.8rem 1rem;color:var(--text);font-family:var(--font-ui);font-size:.95rem;
          transition:border-color .2s var(--ease),box-shadow .2s var(--ease)}
        input:focus,textarea:focus{outline:none;border-color:var(--c-primary);box-shadow:var(--glow)}
        button{justify-self:start;font-family:var(--font-mono);letter-spacing:.16em;text-transform:uppercase;
          font-size:.78rem;padding:.8rem 1.6rem;border-radius:999px;cursor:pointer;color:#150f1f;
          background:linear-gradient(120deg,var(--c-primary),var(--c-accent));border:0;
          transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
        button:hover{transform:translateY(-2px);box-shadow:var(--glow)}
        .hint{font-family:var(--font-mono);font-size:.66rem;letter-spacing:.1em;
          color:var(--text-faint);margin:0}
        .sent{font-family:var(--font-mono);color:var(--c-accent);font-size:1rem;line-height:1.8}
        .sent span{color:var(--text-faint);font-size:.78rem}
      `}</style>
    </div>
  );
}
