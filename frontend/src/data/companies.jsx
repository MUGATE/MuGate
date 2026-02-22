import React from 'react';

// Import all raster logo images from the Logos directory
import WhishLogo from '../pages/Internship/Logos/Whish Money.png';
import TouchLogo from '../pages/Internship/Logos/touch.png';
import YoubeeLogo from '../pages/Internship/Logos/Youbee ai.png';
import XpertBotLogo from '../pages/Internship/Logos/XpertBot.png';
import IDSLogo from '../pages/Internship/Logos/IDS.png';

// 3D Path Data for Logo Extrusion + SVG Strings for Texture
// ORDER: Touch, Youbee, Whish (center default), XpertBot, IDS
export const companyData = [
    {
        id: 3,
        name: "Touch",
        description: "Leading mobile telecommunications and data services operator in Lebanon.",
        colors: ["#ea0c2c", "#c90022", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: TouchLogo,
        email: "careers@touch.com.lb",
        phone: "+961 3 799 799",
        website: "www.touch.com.lb"
    },
    {
        id: 2,
        name: "Youbee AI",
        description: "Pioneering Artificial Intelligence solutions and robust machine learning models.",
        colors: ["#3b82f6", "#1d4ed8", "#ffffff"],
        paths: [],
        scale: 0.02,
        isMetallic: true,
        svgString: YoubeeLogo,
        email: "hello@youbee.ai",
        phone: "+1 (415) 555-0198",
        website: "www.youbee.ai"
    },
    {
        id: 1,
        name: "Whish Money",
        description: "Innovative digital wallet and financial services platform.",
        colors: ["#FF0000", "#cc0000", "#ffffff", "#ff4d4d"],
        paths: [],
        scale: 0.02,
        svgString: WhishLogo,
        forceWhiteBack: true,
        email: "hr@whish.money",
        phone: "+961 1 202 303",
        website: "www.whish.money"
    },
    {
        id: 4,
        name: "XpertBot",
        description: "Delivering fully-integrated robotic automation and expert software systems.",
        colors: ["#f59e0b", "#d97706", "#ffffff"],
        paths: [],
        scale: 0.02,
        isMetallic: true,
        svgString: XpertBotLogo,
        email: "careers@xpertbotacademy.com",
        phone: "+961 70 123 456",
        website: "www.xpertbotacademy.com"
    },
    {
        id: 5,
        name: "IDS",
        description: "Global consulting empowering enterprises through structured data intelligence.",
        colors: ["#10b981", "#059669", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: IDSLogo,
        email: "jobs@ids.com.lb",
        phone: "+961 1 859 101",
        website: "www.ids.com.lb"
    }
];

// Re-export as 'companies' for compatibility if needed, but prefer companyData for 3D
export const companies = companyData;
