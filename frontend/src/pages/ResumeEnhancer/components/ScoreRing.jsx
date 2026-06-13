import React, { useState, useRef, useEffect } from 'react';

const ScoreRing = ({ score = 85, maxScore = 100 }) => {
  const [animated, setAnimated] = useState(0);
  const prevScoreRef = useRef(0);
  const ringRef = useRef(null);
  const hasAppeared = useRef(false);
  const radius = 58;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (animated / maxScore) * circumference;
  const offset = circumference - progress;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAppeared.current) {
          hasAppeared.current = true;
          const duration = 1200;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimated(Math.round(eased * score));
            if (t < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          prevScoreRef.current = score;
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ringRef.current) observer.observe(ringRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasAppeared.current) return;
    const from = prevScoreRef.current;
    const to = score;
    if (to <= from) {
      prevScoreRef.current = to;
      setAnimated(to);
      return;
    }
    prevScoreRef.current = to;
    const duration = 600;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

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
          style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }}
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
