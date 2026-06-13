import { logger } from "../../../core/logger/logger";
import { ScrapedEvent } from "../event.types";
import { unsplashUrl, UNIQUE_IMAGES } from "./scraper.helpers";

/**
 * Baseline set of known annual/recurring tech events in Lebanon.
 */
export async function getCuratedLebaneseEvents(): Promise<ScrapedEvent[]> {
    const year = new Date().getFullYear();
    const events: ScrapedEvent[] = [];

    const addIfUpcoming = (e: ScrapedEvent) => {
        if (e.startDate >= new Date() || (e.endDate && e.endDate >= new Date())) {
            events.push(e);
        }
    };

    // ── AUB AI Hub Workshops ──
    addIfUpcoming({
        title: `AUB Artificial Intelligence, Data Science & Computing Hub Workshops ${year}`,
        description: "Workshops and training sessions at AUB's AI, Data Science, and Computing Hub covering machine learning, data analytics, scientific computing, and AI applications across disciplines.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 8, 1),
        endDate: null,
        category: "workshop",
        tags: "ai, data science, computing, workshop, aub, machine learning",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[0]),
        externalUrl: "https://www.aub.edu.lb/hub/Pages/Workshops.aspx",
        sourceId: `curated_aub_hub_workshops_${year}`,
        scraperSource: "university",
        organizer: "American University of Beirut - AI Hub",
        isFree: true,
    });

    // ── LAU Engineering Summer Camp ──
    addIfUpcoming({
        title: `LAU Engineering Summer Camp ${year}`,
        description: "Week-long introduction to engineering at Lebanese American University for high school students. Hands-on projects in mechanical, electrical, computer, civil, and industrial engineering with LAU faculty.",
        location: "LAU Byblos Campus, Lebanon",
        startDate: new Date(year, 5, 29),
        endDate: new Date(year, 6, 31),
        category: "workshop",
        tags: "engineering, summer camp, high school, stem, lau, byblos",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[1]),
        externalUrl: "https://soe.lau.edu.lb/community-tech/engineering-summer-camp/",
        sourceId: `curated_lau_eng_summer_camp_${year}`,
        scraperSource: "university",
        organizer: "Lebanese American University - School of Engineering",
        isFree: false,
    });

    // ── LAU AI & Robotics Boot Camp ──
    addIfUpcoming({
        title: `LAU Innovators: AI & Robotics Boot Camp ${year}`,
        description: "Intensive summer boot camp at Lebanese American University covering artificial intelligence, robotics engineering, and hands-on project development for students.",
        location: "LAU Beirut & Byblos Campuses, Lebanon",
        startDate: new Date(year, 5, 15),
        endDate: new Date(year, 6, 31),
        category: "workshop",
        tags: "ai, robotics, bootcamp, engineering, summer, lau",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[2]),
        externalUrl: "https://soe.lau.edu.lb/events/",
        sourceId: `curated_lau_ai_robotics_${year}`,
        scraperSource: "university",
        organizer: "Lebanese American University",
        isFree: false,
    });

    // ── LAU Robotics & AI Summer School ──
    addIfUpcoming({
        title: `LAU Engineering Robotics & AI Summer School ${year}`,
        description: "Summer school program focusing on robotics engineering, artificial intelligence, mechatronics, and intelligent systems design at LAU.",
        location: "LAU Beirut & Byblos Campuses, Lebanon",
        startDate: new Date(year, 6, 1),
        endDate: new Date(year, 6, 31),
        category: "workshop",
        tags: "robotics, ai, engineering, summer school, mechatronics",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[3]),
        externalUrl: "https://soe.lau.edu.lb/events/",
        sourceId: `curated_lau_robotics_ai_school_${year}`,
        scraperSource: "university",
        organizer: "Lebanese American University",
        isFree: false,
    });

    // ── Drone Programming Camp ──
    addIfUpcoming({
        title: `Camps Code and Fly: The Drone Programming Experience ${year}`,
        description: "Summer camp at LAU teaching drone programming, autonomous flight, Python coding for drones, and hands-on UAV piloting challenges.",
        location: "LAU Beirut & Byblos Campuses, Lebanon",
        startDate: new Date(year, 5, 22),
        endDate: new Date(year, 6, 31),
        category: "workshop",
        tags: "drone, programming, robotics, coding, summer, python",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[16]),
        externalUrl: "https://soe.lau.edu.lb/events/",
        sourceId: `curated_drone_camp_${year}`,
        scraperSource: "university",
        organizer: "Lebanese American University",
        isFree: false,
    });

    // ── ABLE Summit ──
    addIfUpcoming({
        title: `ABLE Summit ${year}`,
        description: "Annual digital accessibility and inclusive innovation summit at the American University of Beirut, featuring accessible technology, inclusive design, and innovation for people with disabilities.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 8, 21),
        endDate: null,
        category: "conference",
        tags: "accessibility, inclusive design, innovation, digital, disability, summit",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[5]),
        externalUrl: "https://www.aub.edu.lb/hub/Pages/default.aspx",
        sourceId: `curated_able_summit_${year}`,
        scraperSource: "university",
        organizer: "American University of Beirut",
        isFree: true,
    });

    // ── AUB ACM Competitive Programming ──
    addIfUpcoming({
        title: `AUB ACM Competitive Programming Sessions ${year}`,
        description: "Regular coding, logic, and competitive programming sessions hosted by AUB's ACM student chapter and Competitive Coders club. Open to all skill levels from beginner to advanced.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 8, 1),
        endDate: null,
        category: "meetup",
        tags: "acm, competitive programming, algorithms, coding, icpc, community",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[13]),
        externalUrl: "https://sites.aub.edu.lb/competitivecoders/",
        sourceId: `curated_aub_acm_${year}`,
        scraperSource: "university",
        organizer: "AUB ACM Student Chapter",
        isFree: true,
    });

    // ── DeveLeb Workshops ──
    addIfUpcoming({
        title: `DeveLeb Tech Workshop Series ${year}`,
        description: "Community-driven tech workshops by DeveLeb covering Android app development, web technologies, modern frameworks, and career skills for aspiring developers in Lebanon.",
        location: "Beirut, Lebanon",
        startDate: new Date(year, 5, 1),
        endDate: null,
        category: "workshop",
        tags: "android, web, app development, community, workshop, develeb",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[6]),
        externalUrl: "https://www.lebtivity.com/events/lebanon/conferences-workshops",
        sourceId: `curated_develeb_${year}`,
        scraperSource: "other",
        organizer: "DeveLeb Community",
        isFree: true,
    });

    // ── AUB CS Alumni Event ──
    addIfUpcoming({
        title: `AUB Annual Computer Science Alumni Event ${year}`,
        description: "High-level networking event featuring computer science professionals, alumni, graduates, faculty, and industry leaders. Includes AI discussions and career panels.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 5, 20),
        endDate: null,
        category: "social",
        tags: "networking, alumni, career, computer science, ai, panel",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[14]),
        externalUrl: "https://www.aub.edu.lb/Events/",
        sourceId: `curated_aub_cs_alumni_${year}`,
        scraperSource: "university",
        organizer: "AUB Department of Computer Science",
        isFree: true,
    });

    // ── Berytech Programs ──
    addIfUpcoming({
        title: `Berytech Entrepreneurship & Innovation Programs ${year}`,
        description: "Entrepreneurship programs by Berytech supporting startups and SMEs in Lebanon's tech ecosystem. Includes cluster development, networking, and funding opportunities.",
        location: "Berytech Mathaf, Damascus Street, Beirut, Lebanon",
        startDate: new Date(year, 3, 1),
        endDate: null,
        category: "workshop",
        tags: "startup, entrepreneurship, innovation, clusters, berytech, lebanon",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[7]),
        externalUrl: "https://berytech.org/events/",
        sourceId: `curated_berytech_clusters_${year}`,
        scraperSource: "university",
        organizer: "Berytech",
        isFree: true,
    });

    // ── Beirut AI Meetup ──
    addIfUpcoming({
        title: `Beirut AI & Machine Learning Meetup ${year}`,
        description: "Monthly meetup for AI/ML practitioners, researchers, and enthusiasts in Beirut. Includes talks, project showcases, and networking. Open to all skill levels from students to industry professionals.",
        location: "Beirut Digital District (BDD), Lebanon",
        startDate: new Date(year, 5, 8),
        endDate: null,
        category: "meetup",
        tags: "ai, machine learning, deep learning, meetup, networking, beirut",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[8]),
        externalUrl: "https://www.meetup.com/Beirut-AI-Meetup/",
        sourceId: `curated_beirut_ai_${year}`,
        scraperSource: "other",
        organizer: "Beirut AI Community",
        isFree: true,
    });

    // ── Project Lebanon ──
    addIfUpcoming({
        title: `Project Lebanon ${year} — International Trade Fair`,
        description: "Lebanon's premier international trade exhibition for construction, energy, environment, and technology. Features companies showcasing the latest innovations in green building, renewable energy, water tech, and smart infrastructure.",
        location: "Beirut Seaside Arena, Lebanon",
        startDate: new Date(year, 8, 29),
        endDate: new Date(year, 9, 2),
        category: "conference",
        tags: "construction, energy, environment, technology, expo, beirut, trade fair",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[19]),
        externalUrl: "https://www.eventbrite.com/e/project-lebanon-2026-tickets-1987599308035",
        sourceId: `curated_project_lebanon_${year}`,
        scraperSource: "eventbrite",
        organizer: "Project Lebanon",
        isFree: false,
    });

    // ── VIRA Workshop Series ──
    addIfUpcoming({
        title: `VIRA — Vision Intelligence & Robotics Applications Workshop ${year}`,
        description: "Annual workshop on vision intelligence and robotics applications hosted by LAU School of Engineering in collaboration with BMW Group Lebanon. Covers computer vision, AI, and robotics research.",
        location: "LAU Byblos Campus, Lebanon",
        startDate: new Date(year, 3, 1),
        endDate: null,
        category: "workshop",
        tags: "vision, robotics, ai, computer vision, research, lau, bmw",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[17]),
        externalUrl: "https://soe.lau.edu.lb/events/",
        sourceId: `curated_lau_vira_${year}`,
        scraperSource: "university",
        organizer: "LAU School of Engineering / BMW Group Lebanon",
        isFree: true,
    });

    // ── LCPC (Lebanese Collegiate Programming Contest) ──
    addIfUpcoming({
        title: `Lebanese Collegiate Programming Contest (LCPC) ${year}`,
        description: "Prestigious annual ICPC-affiliated programming contest for university students across Lebanon. Teams compete in algorithmic problem-solving for prizes and regional advancement.",
        location: "Beirut Arab University (BAU) Debbiyeh, Lebanon",
        startDate: new Date(year, 9, 15),
        endDate: null,
        category: "competition",
        tags: "icpc, programming, algorithms, competitive programming, contest, teamwork",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[4]),
        externalUrl: "https://lcpc.sk/tools/events.php",
        sourceId: `curated_lcpc_${year}`,
        scraperSource: "university",
        organizer: "ACM / LCPC Committee",
        isFree: true,
    });

    // ── Lebanon Cybersecurity Summit ──
    addIfUpcoming({
        title: `Lebanon Cybersecurity Summit ${year}`,
        description: "Annual cybersecurity conference featuring leading experts on network security, ethical hacking, digital forensics, and data privacy. Keynote sessions and hands-on workshops for IT professionals and students.",
        location: "Beirut, Lebanon",
        startDate: new Date(year, 9, 5),
        endDate: null,
        category: "conference",
        tags: "cybersecurity, security, hacking, privacy, conference, networking",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[15]),
        externalUrl: "https://lebcybersummit.com/",
        sourceId: `curated_cyber_summit_${year}`,
        scraperSource: "other",
        organizer: "Lebanon Cybersecurity Association",
        isFree: false,
    });

    // ── Beirut Code Camp ──
    addIfUpcoming({
        title: `Beirut Code Camp ${year}`,
        description: "Full-day coding event with workshops on web development, mobile apps, cloud computing, and DevOps. Hands-on sessions with experienced mentors. Bring your laptop and build something real.",
        location: "Beirut, Lebanon",
        startDate: new Date(year, 6, 12),
        endDate: null,
        category: "workshop",
        tags: "coding, web dev, mobile, cloud, devops, workshop, lebanon",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[11]),
        externalUrl: "https://www.lebtivity.com/events/lebanon/conferences-workshops",
        sourceId: `curated_beirut_code_camp_${year}`,
        scraperSource: "other",
        organizer: "Beirut Tech Community",
        isFree: true,
    });

    // ── LAU Career Fair ──
    addIfUpcoming({
        title: `LAU Annual Career & Internship Fair ${year}`,
        description: "Lebanese American University's largest career fair connecting students with top employers in tech, finance, engineering, and consulting. Bring your resume and network with recruiters from leading companies.",
        location: "LAU Beirut Campus, Lebanon",
        startDate: new Date(year, 9, 20),
        endDate: null,
        category: "meetup",
        tags: "career, networking, jobs, internships, recruiting, lau, students",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[10]),
        externalUrl: "https://www.lau.edu.lb/career/",
        sourceId: `curated_lau_career_fair_${year}`,
        scraperSource: "university",
        organizer: "LAU Career Center",
        isFree: true,
    });

    // ── AUB CS Distinguished Speaker Series ──
    addIfUpcoming({
        title: `AUB CS Distinguished Speaker Series ${year}`,
        description: "AUB Computer Science department hosts leading researchers and industry experts for talks on cutting-edge topics including quantum computing, distributed systems, and computational biology.",
        location: "American University of Beirut, Lebanon",
        startDate: new Date(year, 6, 15),
        endDate: null,
        category: "talk",
        tags: "cs, research, quantum computing, distributed systems, talk, aub",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[9]),
        externalUrl: "https://www.aub.edu.lb/Events/",
        sourceId: `curated_aub_cs_talk_${year}`,
        scraperSource: "university",
        organizer: "AUB Department of Computer Science",
        isFree: true,
    });

    // ── GDG Beirut DevFest ──
    addIfUpcoming({
        title: `GDG Beirut DevFest ${year}`,
        description: "Google Developer Group Beirut's annual DevFest — a full-day conference with technical sessions on Android, Flutter, Firebase, TensorFlow, Google Cloud, and Web technologies. Open to all developers.",
        location: "Beirut, Lebanon",
        startDate: new Date(year, 9, 25),
        endDate: null,
        category: "conference",
        tags: "google, android, flutter, firebase, cloud, devfest, gdg, lebanon",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[12]),
        externalUrl: "https://gdg.community.dev/gdg-beirut/",
        sourceId: `curated_gdg_devfest_${year}`,
        scraperSource: "other",
        organizer: "Google Developer Group Beirut",
        isFree: true,
    });

    // ── Beirut Product & Design Meetup ──
    addIfUpcoming({
        title: `Beirut Product & Design Meetup ${year}`,
        description: "Monthly meetup for product managers, UX designers, and tech entrepreneurs in Beirut. Discuss product strategy, design thinking, user research, and growth with peers from top startups.",
        location: "Beirut Digital District (BDD), Lebanon",
        startDate: new Date(year, 6, 5),
        endDate: null,
        category: "meetup",
        tags: "product management, ux design, design thinking, startup, meetup",
        imageUrl: unsplashUrl(UNIQUE_IMAGES[18]),
        externalUrl: "https://www.lebtivity.com/events/lebanon/conferences-workshops",
        sourceId: `curated_beirut_product_${year}`,
        scraperSource: "other",
        organizer: "Beirut Product Community",
        isFree: true,
    });

    logger.info(`Curated Lebanese tech events: ${events.length}`);
    return events;
}
