import React, { useEffect, useRef } from 'react';

const FluidTrail = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        const ctx = canvas.getContext('2d');
        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;

        // Handle high DPI displays for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const resize = () => {
            width = parent.offsetWidth;
            height = parent.offsetHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        };
        window.addEventListener('resize', resize);

        // Mouse trailing parameters
        let pointer = { x: width / 2, y: height / 2 };
        let trail = [];
        const params = { pointsNumber: 50, spring: 0.4, friction: 0.5 };
        let targetOpacity = 0;
        let currentOpacity = 0;

        // Initialize points
        for (let i = 0; i < params.pointsNumber; i++) {
            trail.push({ x: pointer.x, y: pointer.y, dx: 0, dy: 0 });
        }

        const updateMouse = (e) => {
            const rect = canvas.getBoundingClientRect();
            pointer.x = e.clientX - rect.left;
            pointer.y = e.clientY - rect.top;
        };

        const handleMouseEnter = (e) => {
            targetOpacity = 0.8; // Fade in max opacity
            const rect = canvas.getBoundingClientRect();
            pointer.x = e.clientX - rect.left;
            pointer.y = e.clientY - rect.top;

            // Snap the trail to the mouse instantly so it doesn't draw a line from the center on entry
            for (let i = 0; i < params.pointsNumber; i++) {
                trail[i].x = pointer.x;
                trail[i].y = pointer.y;
                trail[i].dx = 0;
                trail[i].dy = 0;
            }
        };

        const handleMouseLeave = () => {
            targetOpacity = 0; // Fade out completely
        };

        // Attach listener strictly to the parent wrapper, so it does not track globally
        if (parent) {
            parent.addEventListener('mousemove', updateMouse);
            parent.addEventListener('mouseenter', handleMouseEnter);
            parent.addEventListener('mouseleave', handleMouseLeave);
        }

        const update = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Smoothly interpolate opacity
            currentOpacity += (targetOpacity - currentOpacity) * 0.1;

            if (currentOpacity > 0.01) {
                // Fluid Momentum Math Setup (Spring physics tracking the cursor)
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

                // Draw the smooth curve
                ctx.globalAlpha = currentOpacity;
                ctx.lineCap = "round";
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

                // Apply dynamic gradient tail requested by user:
                // Head (under cursor) = #e8e9f4, dissipating Tail = #f1f7ee
                const gradient = ctx.createLinearGradient(
                    trail[params.pointsNumber - 1].x, trail[params.pointsNumber - 1].y,
                    trail[0].x, trail[0].y
                );
                gradient.addColorStop(0, "rgba(241, 247, 238, 0)"); // Fade out completely
                gradient.addColorStop(0.4, "rgba(241, 247, 238, 0.7)"); // Soft tail
                gradient.addColorStop(1, "rgba(232, 233, 244, 0.95)"); // Bright head

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 140; // Extremely soft, thick brush
                ctx.filter = 'blur(25px)';
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            requestAnimationFrame(update);
        };

        const animId = requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
            if (parent) {
                parent.removeEventListener('mousemove', updateMouse);
                parent.removeEventListener('mouseenter', handleMouseEnter);
                parent.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
};

export default FluidTrail;
