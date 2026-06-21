import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const WORD = ["b", "r", "e", "a", "c", "h", ":", "d"];
const KEY = "breachd_intro_seen";

export default function Intro() {
  const root = useRef(null);
  const lettersRef = useRef([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // play once per session; respect reduced motion (skip the drift, no overlay)
    const seen = sessionStorage.getItem(KEY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) return;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const letters = lettersRef.current.filter(Boolean);
    const dismissed = { v: false };

    const dismiss = () => {
      if (dismissed.v) return;
      dismissed.v = true;
      sessionStorage.setItem(KEY, "1");
      gsap.to(root.current, {
        autoAlpha: 0,
        duration: 0.7,
        ease: "power2.inOut",
        onComplete: () => setMounted(false),
      });
    };

    // each letter drifts in from a random offset, settles, then breathes
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    letters.forEach((el, i) => {
      const dx = (Math.sin(i * 99.13) * 1000) % 1;
      const dy = (Math.sin(i * 53.71) * 1000) % 1;
      gsap.set(el, {
        x: dx * 240,
        y: dy * 180,
        rotation: dx * 40,
        autoAlpha: 0,
        filter: "blur(14px)",
      });
      tl.to(
        el,
        {
          x: 0,
          y: 0,
          rotation: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 1.5,
        },
        i * 0.12
      );
    });

    // subtle endless drift after settling
    tl.add(() => {
      letters.forEach((el, i) => {
        gsap.to(el, {
          y: "+=6",
          duration: 2 + (i % 3) * 0.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    });

    tl.to(".intro-enter", { autoAlpha: 1, duration: 0.6 }, "-=0.4");

    // auto-dismiss, or let the user skip/enter
    const auto = gsap.delayedCall(4.6, dismiss);
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") dismiss();
    };
    window.addEventListener("keydown", onKey);
    root.current?.addEventListener("click", dismiss);

    return () => {
      auto.kill();
      tl.kill();
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="intro" ref={root} role="dialog" aria-label="Intro">
      <div className="intro-word">
        {WORD.map((ch, i) => (
          <span
            key={i}
            ref={(el) => (lettersRef.current[i] = el)}
            className={ch === ":" ? "ch colon" : "ch"}
          >
            {ch}
          </span>
        ))}
      </div>
      <button className="intro-enter" onClick={() => {}}>
        click anywhere to enter
      </button>

      <style>{`
        .intro{position:fixed;inset:0;z-index:1000;display:grid;place-content:center;justify-items:center;
          gap:2.5rem;background:radial-gradient(900px 600px at 50% 40%, #2a1f3d, #150f1f 70%);cursor:pointer}
        .intro-word{display:flex;font-family:var(--font-display);font-weight:700;
          font-size:clamp(3rem,16vw,11rem);letter-spacing:-0.02em;line-height:1;color:#ece9f5}
        .intro-word .ch{display:inline-block;will-change:transform,filter,opacity;
          text-shadow:0 0 40px rgba(200,156,251,.35)}
        .intro-word .colon{color:#63cfb7;text-shadow:0 0 40px rgba(99,207,183,.6)}
        .intro-enter{visibility:hidden;opacity:0;background:none;border:0;cursor:pointer;
          font-family:var(--font-mono);font-size:.72rem;letter-spacing:.42em;text-transform:uppercase;
          color:#7d769a;animation:flick 2.6s ease-in-out infinite}
        @keyframes flick{0%,100%{color:#7d769a}50%{color:#c89cfb}}
      `}</style>
    </div>
  );
}
