import React from 'react';

// Import all raster logo images from the Logos directory
import WhishLogo from '../pages/Internship/Logos/Whish Money.png';
import TouchLogo from '../pages/Internship/Logos/touch.png';
import YoubeeLogo from '../pages/Internship/Logos/Youbee ai.png';
import XpertBotLogo from '../pages/Internship/Logos/XpertBot.png';
import IDSLogo from '../pages/Internship/Logos/IDS.png';
import FortyTwoBeirutLogo from '../pages/Internship/Logos/42 Beirut.png';
import AlMaarefLogo from '../pages/Internship/Logos/Al Maaref.png';
import BrainketsLogo from '../pages/Internship/Logos/Brainkets.png';
import DynasoftLogo from '../pages/Internship/Logos/Dynasoft.png';
import EktidarLogo from '../pages/Internship/Logos/Ektidar.png';
import NeruosLogo from '../pages/Internship/Logos/Neruos.png';
import SemicolonLogo from '../pages/Internship/Logos/Semicolon.png';
import SoftaviaLogo from '../pages/Internship/Logos/Softavia.png';
import VanriseLogo from '../pages/Internship/Logos/Vanrise.png';

// 3D Path Data for Logo Extrusion + SVG Strings for Texture
// ORDER: Touch, Youbee, Whish (center default), XpertBot, IDS, 42 Beirut
// IDs must match backend seed insert order (IDENTITY) so reviews share one DB.
export const companyData = [
    {
        id: 1,
        name: "Touch",
        description: "Leading mobile telecommunications and data services operator in Lebanon.",
        colors: ["#ea0c2c", "#c90022", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: TouchLogo,
        email: "careers@touch.com.lb",
        phone: "+961 3 799 799",
        website: "www.touch.com.lb",
                ratings: []
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
        website: "www.youbee.ai",
                ratings: []
    },
    {
        id: 3,
        name: "Whish Money",
        description: "Innovative digital wallet and financial services platform.",
        colors: ["#FF0000", "#cc0000", "#ffffff", "#ff4d4d"],
        paths: [],
        scale: 0.02,
        svgString: WhishLogo,
        forceWhiteBack: true,
        email: "hr@whish.money",
        phone: "+961 1 202 303",
        website: "www.whish.money",
                ratings: []
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
        website: "www.xpertbotacademy.com",
                ratings: []
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
        website: "www.ids.com.lb",
                ratings: []
    },
    {
        id: 6,
        name: "42 Beirut",
        description: "Innovative peer-to-peer coding school with a project-based curriculum.",
        colors: ["#00babc", "#009a9c", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: FortyTwoBeirutLogo,
                forceWhiteBack: true,
        email: "contact@42beirut.com",
        phone: "+961 1 000 000",
        website: "www.42beirut.com",
                ratings: []
        },
    {
        id: 7,
        name: "Al Maaref",
        description: "Leading educational institution providing quality learning and professional development programs.",
        colors: ["#1e3a5f", "#152d4a", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: AlMaarefLogo,
        email: "info@almaaref.edu.lb",
        phone: "+961 1 300 400",
        website: "www.almaaref.edu.lb",
                ratings: []
    },
    {
        id: 8,
        name: "Brainkets",
        description: "Creative digital agency specializing in web development, mobile apps, and digital marketing.",
        colors: ["#e74c3c", "#c0392b", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: BrainketsLogo,
        email: "hello@brainkets.com",
        phone: "+961 1 456 789",
        website: "www.brainkets.com",
                ratings: []
    },
    {
        id: 9,
        name: "Dynasoft",
        description: "Enterprise software solutions provider specializing in ERP and business process automation.",
        colors: ["#2980b9", "#1a6fa0", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: DynasoftLogo,
        email: "careers@dynasoft.com.lb",
        phone: "+961 1 567 890",
        website: "www.dynasoft.com.lb",
                ratings: []
    },
    {
        id: 10,
        name: "Ektidar",
        description: "Technology consultancy empowering businesses with innovative digital transformation solutions.",
        colors: ["#8e44ad", "#71368a", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: EktidarLogo,
        email: "info@ektidar.com",
        phone: "+961 1 678 901",
        website: "www.ektidar.com",
                ratings: []
    },
    {
        id: 11,
        name: "Neruos",
        description: "AI-driven healthcare technology company building intelligent diagnostic and analytics platforms.",
        colors: ["#00b894", "#009d80", "#ffffff"],
        paths: [],
        scale: 0.02,
        isMetallic: true,
        svgString: NeruosLogo,
        email: "contact@neruos.com",
        phone: "+961 1 789 012",
        website: "www.neruos.com",
                ratings: []
    },
    {
        id: 12,
        name: "Semicolon",
        description: "Coding academy and tech community offering intensive bootcamps and developer training.",
        colors: ["#f39c12", "#d68910", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: SemicolonLogo,
        email: "info@semicolon.academy",
        phone: "+961 1 890 123",
        website: "www.semicolon.academy",
                ratings: []
    },
    {
        id: 13,
        name: "Softavia",
        description: "Custom software development firm delivering scalable web and mobile solutions.",
        colors: ["#3498db", "#2176ae", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: SoftaviaLogo,
        email: "hr@softavia.com",
        phone: "+961 1 901 234",
        website: "www.softavia.com",
                ratings: []
    },
    {
        id: 14,
        name: "Vanrise",
        description: "Telecom and enterprise solutions provider specializing in revenue assurance and fraud management.",
        colors: ["#e67e22", "#cf6d17", "#ffffff"],
        paths: [],
        scale: 0.02,
        isMetallic: true,
        svgString: VanriseLogo,
        email: "careers@vanrise.com",
        phone: "+961 1 012 345",
        website: "www.vanrise.com",
                ratings: []
    }
];

// Helper to calculate average rating
companyData.forEach(company => {
    if (company.ratings && company.ratings.length > 0) {
        const sum = company.ratings.reduce((acc, curr) => acc + curr.rating, 0);
        company.averageRating = (sum / company.ratings.length).toFixed(1);

        // Sort ratings by date descending (latest first)
        company.ratings.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
        company.averageRating = "0.0";
    }
});
// Re-export as 'companies' for compatibility if needed, but prefer companyData for 3D
export const companies = companyData;
