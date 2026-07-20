import React, { useState, useRef, useEffect } from 'react';

const ScoreRing = ({ score = 0, maxScore = 100 }) => {
  const safeScore = Math.max(0, Math.min(maxScore, Math.round(Number(score) || 0)));
  const [animated, setAnimated] = useState(safeScore);
  const prevScoreRef = useRef(safeScore);
  const ringRef = useRef(null);
  const radius = 58;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (animated / maxScore) * circumference;
  const offset = circumference - progress;

  useEffect(() => {
    const from = prevScoreRef.current;
    const to = safeScore;
    if (from === to) {
      setAnimated(to);
      return;
    }
    prevScoreRef.current = to;
    const duration = Math.abs(to - from) > 30 ? 700 : 400;
    const startTime = performance.now();
    let raf;
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [safeScore]);

  const getColor = () => {
    if (animated >= 80) return '#22c55e';
    if (animated >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="score-ring-container" ref={ringRef}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke 0.35s ease' }}
        />
      </svg>
      <div className="score-value">
        <span className="score-number">{animated}</span>
        <span className="score-max">/ {maxScore}</span>
      </div>
    </div>
  );
};

export default ScoreRing;
