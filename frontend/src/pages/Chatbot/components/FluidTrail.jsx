import React, { useEffect, useRef, useState } from 'react';

/** Exported for unit tests — disable trail on reduced-motion or coarse touch pointers. */
export const shouldDisableFluidTrail = (matchMediaFn = typeof window !== 'undefined' ? window.matchMedia.bind(window) : null) => {
    if (!matchMediaFn) return true;
    if (matchMediaFn('(prefers-reduced-motion: reduce)').matches) return true;
    if (matchMediaFn('(hover: none)').matches && matchMediaFn('(pointer: coarse)').matches) return true;
    return false;
};

const FluidTrail = ({ scrollable = false }) => {
    const canvasRef = useRef(null);
    const [enabled, setEnabled] = useState(() => !shouldDisableFluidTrail());

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const noHover = window.matchMedia('(hover: none)');
        const coarse = window.matchMedia('(pointer: coarse)');

        const sync = () => setEnabled(!shouldDisableFluidTrail());
        sync();

        reducedMotion.addEventListener?.('change', sync);
        noHover.addEventListener?.('change', sync);
        coarse.addEventListener?.('change', sync);
        reducedMotion.addListener?.(sync);
        noHover.addListener?.(sync);
        coarse.addListener?.(sync);

        return () => {
            reducedMotion.removeEventListener?.('change', sync);
            noHover.removeEventListener?.('change', sync);
            coarse.removeEventListener?.('change', sync);
            reducedMotion.removeListener?.(sync);
            noHover.removeListener?.(sync);
            coarse.removeListener?.(sync);
        };
    }, []);

    useEffect(() => {
        if (!enabled) return undefined;

        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const parent = canvas.parentElement;
        if (!parent) return undefined;
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;
        let animId = 0;
        let running = true;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const resize = () => {
            width = parent.clientWidth;
            height = parent.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        window.addEventListener('resize', resize);

        let pointer = { x: width / 2, y: height / 2 };
        let trail = [];
        const params = { pointsNumber: 50, spring: 0.4, friction: 0.5 };
        let targetOpacity = 0;
        let currentOpacity = 0;

        for (let i = 0; i < params.pointsNumber; i++) {
            trail.push({ x: pointer.x, y: pointer.y, dx: 0, dy: 0 });
        }

        const updateMouse = (e) => {
            const rect = parent.getBoundingClientRect();
            pointer.x = e.clientX - rect.left;
            pointer.y = e.clientY - rect.top;
        };

        const handleMouseEnter = (e) => {
            targetOpacity = 0.8;
            const rect = parent.getBoundingClientRect();
            pointer.x = e.clientX - rect.left;
            pointer.y = e.clientY - rect.top;

            for (let i = 0; i < params.pointsNumber; i++) {
                trail[i].x = pointer.x;
                trail[i].y = pointer.y;
                trail[i].dx = 0;
                trail[i].dy = 0;
            }
        };

        const handleMouseLeave = () => {
            targetOpacity = 0;
        };

        parent.addEventListener('mousemove', updateMouse);
        parent.addEventListener('mouseenter', handleMouseEnter);
        parent.addEventListener('mouseleave', handleMouseLeave);

        const update = () => {
            if (!running) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            currentOpacity += (targetOpacity - currentOpacity) * 0.1;

            if (currentOpacity > 0.01) {
                trail[0].x += (pointer.x - trail[0].x) * params.spring;
                trail[0].y += (pointer.y - trail[0].y) * params.spring;

                for (let i = 1; i < params.pointsNumber; i++) {
                    const p = trail[i];
                    const prev = trail[i - 1];
                    p.dx += (prev.x - p.x) * params.spring;
                    p.dy += (prev.y - p.y) * params.spring;
                    p.dx *= params.friction;
                    p.dy *= params.friction;
                    p.x += p.dx;
                    p.y += p.dy;
                }

                ctx.globalAlpha = currentOpacity;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(trail[0].x, trail[0].y);

                for (let i = 1; i < params.pointsNumber - 1; i++) {
                    const xc = 0.5 * (trail[i].x + trail[i + 1].x);
                    const yc = 0.5 * (trail[i].y + trail[i + 1].y);
                    ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
                }
                ctx.quadraticCurveTo(
                    trail[params.pointsNumber - 2].x,
                    trail[params.pointsNumber - 2].y,
                    trail[params.pointsNumber - 1].x,
                    trail[params.pointsNumber - 1].y
                );

                const gradient = ctx.createLinearGradient(
                    trail[params.pointsNumber - 1].x, trail[params.pointsNumber - 1].y,
                    trail[0].x, trail[0].y
                );
                gradient.addColorStop(0, 'rgba(79, 69, 200, 0)');
                gradient.addColorStop(0.4, 'rgba(79, 69, 200, 0.55)');
                gradient.addColorStop(1, 'rgba(61, 66, 176, 0.85)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 140;
                ctx.filter = 'blur(25px)';
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            animId = requestAnimationFrame(update);
        };

        animId = requestAnimationFrame(update);

        return () => {
            running = false;
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
            parent.removeEventListener('mousemove', updateMouse);
            parent.removeEventListener('mouseenter', handleMouseEnter);
            parent.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [enabled]);

    if (!enabled) return null;

    const style = scrollable
        ? { position: 'sticky', top: 0, left: 0, width: '100%', height: '100vh', marginBottom: '-100vh', pointerEvents: 'none', zIndex: 0, flexShrink: 0 }
        : { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 };
    return <canvas ref={canvasRef} style={style} aria-hidden="true" />;
};

export default FluidTrail;
