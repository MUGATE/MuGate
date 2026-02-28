import React from 'react';

// Import all raster logo images from the Logos directory
import WhishLogo from '../pages/Internship/Logos/Whish Money.png';
import TouchLogo from '../pages/Internship/Logos/touch.png';
import YoubeeLogo from '../pages/Internship/Logos/Youbee ai.png';
import XpertBotLogo from '../pages/Internship/Logos/XpertBot.png';
import IDSLogo from '../pages/Internship/Logos/IDS.png';
import FortyTwoBeirutLogo from '../pages/Internship/Logos/42 Beirut.png';

// 3D Path Data for Logo Extrusion + SVG Strings for Texture
// ORDER: Touch, Youbee, Whish (center default), XpertBot, IDS, 42 Beirut
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
        website: "www.touch.com.lb",
        ratings: [
            { user: "Ali H.", rating: 5, feedback: "Great learning environment and supportive team.", date: "2023-08-15" },
            { user: "Sara M.", rating: 4, feedback: "Good exposure to telecom operations.", date: "2023-07-20" }
        ]
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
        ratings: [
            { user: "Omar K.", rating: 5, feedback: "Amazing AI projects, challenging but very rewarding.", date: "2023-09-01" },
            { user: "Nour F.", rating: 5, feedback: "Incredible mentorship in machine learning.", date: "2023-08-10" }
        ]
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
        website: "www.whish.money",
        ratings: [
            { user: "Jad T.", rating: 4, feedback: "Fast-paced fintech experience, learned a lot.", date: "2023-06-15" },
            { user: "Lara Y.", rating: 5, feedback: "Great culture and modern tech stack.", date: "2023-07-05" }
        ]
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
        ratings: [
            { user: "Ramy E.", rating: 4, feedback: "Excellent hands-on robotics and software integration.", date: "2023-05-22" },
            { user: "Maya Z.", rating: 3, feedback: "Interesting projects but management could be better.", date: "2023-04-10" }
        ]
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
        ratings: [
            { user: "Tarek B.", rating: 5, feedback: "Strong enterprise architecture and data intelligence focus.", date: "2023-08-05" },
            { user: "Zeina A.", rating: 4, feedback: "Good solid grounding in consulting practices.", date: "2023-06-30" }
        ]
    },
    {
        id: 6,
        name: "42 Beirut",
        description: "Innovative peer-to-peer coding school with a project-based curriculum.",
        colors: ["#00babc", "#009a9c", "#ffffff"],
        paths: [],
        scale: 0.02,
        svgString: FortyTwoBeirutLogo,
        email: "contact@42beirut.com",
        phone: "+961 1 000 000",
        website: "www.42beirut.com",
        ratings: [
            { user: "Karim S.", rating: 5, feedback: "Innovative peer-to-peer coding, fantastic community.", date: "2023-09-15" },
            { user: "Dana H.", rating: 5, feedback: "The best place to truly learn how to learn.", date: "2023-09-05" }
        ]
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
