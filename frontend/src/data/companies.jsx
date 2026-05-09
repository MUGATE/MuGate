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
                forceWhiteBack: true,
        email: "contact@42beirut.com",
        phone: "+961 1 000 000",
        website: "www.42beirut.com",
        ratings: [
            { user: "Karim S.", rating: 5, feedback: "Innovative peer-to-peer coding, fantastic community.", date: "2023-09-15" },
            { user: "Dana H.", rating: 5, feedback: "The best place to truly learn how to learn.", date: "2023-09-05" }
        ]
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
        ratings: [
            { user: "Hassan R.", rating: 4, feedback: "Great educational resources and supportive staff.", date: "2023-07-12" },
            { user: "Rana K.", rating: 4, feedback: "Solid academic foundation with practical approach.", date: "2023-06-18" }
        ]
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
        ratings: [
            { user: "Ahmad L.", rating: 5, feedback: "Incredible creative environment, learned modern web tech.", date: "2023-08-20" },
            { user: "Dina S.", rating: 4, feedback: "Great team culture and hands-on project experience.", date: "2023-07-15" }
        ]
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
        ratings: [
            { user: "Fadi M.", rating: 4, feedback: "Solid enterprise software experience with real clients.", date: "2023-09-10" },
            { user: "Layla B.", rating: 3, feedback: "Good technical learning but fast-paced deadlines.", date: "2023-08-25" }
        ]
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
        ratings: [
            { user: "Sami W.", rating: 5, feedback: "Excellent mentorship and cutting-edge projects.", date: "2023-09-18" },
            { user: "Nadia T.", rating: 4, feedback: "Great exposure to digital transformation strategies.", date: "2023-08-30" }
        ]
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
        ratings: [
            { user: "Khaled A.", rating: 5, feedback: "Fascinating AI healthcare projects, very innovative team.", date: "2023-09-22" },
            { user: "Mira J.", rating: 5, feedback: "Best internship for anyone interested in AI and health tech.", date: "2023-09-12" }
        ]
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
        ratings: [
            { user: "Youssef D.", rating: 5, feedback: "Intensive and rewarding bootcamp experience.", date: "2023-08-18" },
            { user: "Rita N.", rating: 4, feedback: "Great community and practical coding skills.", date: "2023-07-28" }
        ]
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
        ratings: [
            { user: "Bilal H.", rating: 4, feedback: "Great hands-on development with real-world projects.", date: "2023-09-05" },
            { user: "Hala F.", rating: 4, feedback: "Supportive team and good work-life balance.", date: "2023-08-15" }
        ]
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
        ratings: [
            { user: "Wael G.", rating: 5, feedback: "Top-tier telecom experience with enterprise-grade systems.", date: "2023-09-20" },
            { user: "Lina M.", rating: 4, feedback: "Challenging but very educational environment.", date: "2023-08-22" }
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
