import React from 'react';

// SVG Logo Components with Metallic Gradients

export const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" className="company-logo">
        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" filter="url(#glow)" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" filter="url(#glow)" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" filter="url(#glow)" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" filter="url(#glow)" />
    </svg>
);

export const AppleLogo = () => (
    <svg viewBox="0 0 384 512" className="company-logo">
        <defs>
            <linearGradient id="appleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#e0e0e0', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#909090', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#404040', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="metalBump" x="0" y="0" width="200%" height="200%">
                <feOffset result="offOut" in="SourceAlpha" dx="1" dy="1" />
                <feGaussianBlur result="blurOut" in="offOut" stdDeviation="5" />
                <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
            </filter>
        </defs>
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" fill="url(#appleGradient)" />
    </svg>
);

export const MicrosoftLogo = () => (
    <svg viewBox="0 0 23 23" className="company-logo">
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
);

export const AmazonLogo = () => (
    <svg viewBox="0 0 24 24" className="company-logo">
        <defs>
            <linearGradient id="amazonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#FF9900', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#FFB700', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <path d="M13.6 15.6c-.7.5-1.5.8-2.6.8-1.5 0-2.8-.7-2.8-2.5 0-1.7 1.3-2.6 3.8-2.6.6 0 1.2.1 1.7.2v4.1zm2.3-9c1.9 0 3.5.7 4.1 2.8h-2c-.4-1.2-1.2-1.5-2.1-1.5-1.5 0-2.3 1-2.3 2.5v.3c.7-.4 1.7-.7 2.8-.7 2.8 0 4.8 1.5 4.8 4.6 0 3.3-2.5 5.5-6.1 5.5-2.6 0-4.3-.9-5.1-2.2-.1 1.4-1.1 2.1-2.4 2.1H7c.2-1.3.4-3 .4-5.2 0-3.3-1-5.1-3.2-5.7L4 7.6c1.6.4 2 1.3 2 3v.6c-2.6.2-5.4 1.3-5.4 4.5 0 2.4 1.9 4.1 4.3 4.1 1.8 0 3-.8 3.7-1.9v1.7h2.1V9.5c.1-1.9 1.3-2.9 2.9-2.9zm5.9 13.9c.7-.6 3.1-4.8 6.2-1.2.2.3.2.6-.2.8-.7.3-1.6.3-2.4-.4-2.6-2.5-4.1-.1-4.4.4-.2.4-.6.6-1 .2.1-.2 1.1-.9 1.8.2z" fill="url(#amazonGradient)" />
    </svg>
);

export const MetaLogo = () => (
    <svg viewBox="0 0 320 200" className="company-logo" fill="currentColor">
        <defs>
            <linearGradient id="metaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#0064E0', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#0081FB', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <path d="M211 44c18 29.5 50.5 83 50.5 83s16-27.5 32.5-56c15.5-26.5 45.5-25 45.5-25-10.5-25-46-24-46-24-34 5-29 45.5-32 54-18 43.5-38.5 76-78.5 76-43.5 0-61.5-34.5-74-60-12-24.5-36-70-73-70-38 0-66 31-66 76 0 45 28.5 76 66 76 34.5 0 57-36 71-62 13.5-25.5 28-56 63.5-56 31.5 0 49 19 61.5 41C250 131 289 199 319.5 199c43.5 0 80.5-54 80.5-99.5 0-46-37-88.5-80.5-88.5-47.5 0-77 50.5-108.5 107-11.5 20-22 40-35 62-13 22.5-36.5 61-71 61-45.5 0-82.5-51-82.5-92.5C22.5 106.5 59.5 56 105 56c49 0 79 48.5 106 102 12 24 23 45.5 36.5 62 14 17 38.5 44 67.5 44 49 0 91-45 91-95 0-48.5-38-89.5-86.5-89.5-40 0-68 31-90.5 64.5" fill="url(#metaGradient)" />
    </svg>
);


// 3D Path Data for Logo Extrusion + SVG Strings for Texture
// ORDER: Microsoft, Apple, Google (center default), Amazon, Meta
export const companyData = [
    {
        id: 3,
        name: "Microsoft",
        description: "Empowering every person and every organization on the planet to achieve more.",
        colors: ["#f35325", "#81bc06", "#05a6f0", "#ffba08"],
        paths: [
            "M1 1h10v10H1z",
            "M12 1h10v10H12z",
            "M1 12h10v10H1z",
            "M12 12h10v10H12z"
        ],
        scale: 0.2,
        svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>`
    },
    {
        id: 2,
        name: "Apple",
        description: "Leading the way in innovation with premium hardware and software.",
        colors: ["#A0A0A0"],
        paths: [
            "M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"
        ],
        scale: 0.015,
        isMetallic: true,
        svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="512" viewBox="0 0 384 512"><defs><linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e0e0e0"/><stop offset="50%" stop-color="#909090"/><stop offset="100%" stop-color="#404040"/></linearGradient></defs><path fill="url(#appleGrad)" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/></svg>`
    },
    {
        id: 1,
        name: "Google",
        description: "Organizing the world's information and making it universally accessible.",
        colors: ["#4285F4", "#34A853", "#FBBC05", "#EA4335"],
        paths: [
            "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
            "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
            "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
            "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        ],
        scale: 0.02,
        svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`
    },
    {
        id: 4,
        name: "Amazon",
        description: "Earth's most customer-centric company for almost anything.",
        colors: ["#FF9900"],
        paths: [
            "M257.2 162.7c-48.7 1.8-169.5 15.5-169.5 117.5 0 109.5 138.3 114 183.5 43.2"
        ],
        scale: 0.02,
        isMetallic: true,
        svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 448 512"><path fill="#FF9900" d="M257.2 162.7c-48.7 1.8-169.5 15.5-169.5 117.5 0 109.5 138.3 114 183.5 43.2 6.5 10.2 35.4 37.5 45.3 46.8l56.8-56S341 288.9 341 261.4V114.3C341 89 316.5 32 228.7 32 140.7 32 94 87 94 136.3l73.5 6.8c16.3-49.5 54.2-49.5 54.2-49.5 40.7-.1 40.7 35.4 35.5 69.1zM257.2 212s-47 0-47 33.3c0 33.3 31.4 48.1 47 0v-33.3zm143 166.3c0 0-73.3 62-196.2 62-135 0-208-76.3-208-76.3-4-3.1-3.9-8.5.4-11.4 3.9-2.7 8.5-2 11.6 1.6 0 0 63.8 67.4 196.2 67.4 132.2 0 197.3-65.3 197.3-65.3 3.1-3.1 8.1-3.1 11.2 0 3 3.1 3 8.1-.5 11.6v10.4zm30.5-34.4c-1 4.2-5.8 5.6-9 3.2-12.1-8.7-39.3-29-52.2-35.5-3.5-1.8-3.4-6.6.2-8.2l33.2-15.3c3.6-1.5 7.9 0 9.4 3.6l18.4 48.6c.5 1.4.4 2.5 0 3.6z"/></svg>`
    },
    {
        id: 5,
        name: "Meta",
        description: "Giving people the power to build community and bring the world closer together.",
        colors: ["#0081FB"],
        paths: [],
        scale: 0.015,
        svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 80 80"><path d="M27.8 65C20.53 65 15 57.87 15 47.17c0-10.73 5.53-17.92 12.8-17.92 3.87 0 6.7 1.87 9.23 5.47L40 39.2l2.97-4.48c2.53-3.6 5.37-5.47 9.23-5.47C59.47 29.25 65 36.44 65 47.17 65 57.87 59.47 65 52.2 65c-3.87 0-6.7-1.87-9.23-5.47L40 55.05l-2.97 4.48C34.5 63.13 31.67 65 27.8 65zm0-6.8c1.73 0 3.17-.97 4.9-3.53l4.7-7.07-4.7-7.07c-1.73-2.57-3.17-3.53-4.9-3.53-3.73 0-6 4.47-6 10c0 5.53 2.27 11.2 6 11.2zm24.4 0c3.73 0 6-5.67 6-11.2 0-5.53-2.27-10-6-10-1.73 0-3.17.97-4.9 3.53l-4.7 7.07 4.7 7.07c1.73 2.57 3.17 3.53 4.9 3.53z" fill="#0081FB"/></svg>`
    },
];

// Re-export as 'companies' for compatibility if needed, but prefer companyData for 3D
export const companies = companyData;
