import { CapstoneRepository, CapstoneIdea } from "./capstone.repository";
import { AiProvider } from "../ai/chatbot/ai/ai.provider";
import { logger } from "../../core/logger/logger";

/**
 * Capstone Service — handles AI-powered idea suggestions and partner matching logic.
 */
export class CapstoneService {

    /**
     * Generate the system prompt for the Capstone AI advisor.
     * Includes relevant capstone ideas from the database as context.
     */
    static buildCapstoneSystemPrompt(ideas: CapstoneIdea[], conversationContext: string = ""): string {
        let prompt = `You are the Capstone Project Advisor AI for MuGate — the student portal for Al Maaref University (MU) in Lebanon. Your role is to help students brainstorm, refine, and develop capstone project ideas.

CORE RULES:
1. Be creative, encouraging, and constructive. Help students think through their ideas.
2. When suggesting ideas, draw from the database of past capstone projects provided below.
3. If a student has a niche in mind, find the most relevant past projects and suggest variations or improvements.
4. Help students refine their ideas by asking clarifying questions about scope, technology, feasibility, and impact.
5. Suggest project titles, brief descriptions, potential technologies, and expected outcomes.
6. Be concise but thorough. Use numbered lists for multiple suggestions.
7. Do NOT fabricate specific university policies or requirements.
8. Keep responses conversational and student-friendly.
9. If the student's idea is outside the scope of capstone projects, gently redirect them.
`;

        if (ideas.length > 0) {
            prompt += `
HISTORICAL CAPSTONE PROJECT IDEAS DATABASE:
The following are real past capstone project ideas from Al Maaref University. Use these as inspiration and reference when helping students. You can suggest similar projects, improved versions, or entirely new ideas inspired by these.

---
`;
            for (const idea of ideas) {
                prompt += `[${idea.year || 'N/A'}] ${idea.title}`;
                if (idea.faculty) prompt += ` (${idea.faculty})`;
                prompt += `\n${idea.description}`;
                if (idea.tags) prompt += `\nTags: ${idea.tags}`;
                prompt += `\n\n`;
            }
            prompt += `---

`;
        } else {
            prompt += `
NOTE: No historical capstone ideas are currently loaded in the database. You may still help students brainstorm using your general knowledge of university capstone projects, but note that you don't have MU-specific past project data to reference.

`;
        }

        return prompt;
    }

    /**
     * Chat with the Capstone AI advisor.
     * Retrieves relevant ideas from the DB based on the user's message,
     * then generates an AI response with those ideas as context.
     */
    static async chat(
        message: string,
        history: Array<{ role: string; content: string }> = []
    ): Promise<{ text: string; tokensUsed: number; ideasUsed: number }> {
        try {
            // Extract keywords from the message for targeted idea retrieval
            let relevantIdeas: CapstoneIdea[] = [];

            // Try to find ideas matching the user's message keywords
            if (message.trim().length > 3) {
                // Extract meaningful keywords (skip common words)
                const stopWords = new Set([
                    'i', 'me', 'my', 'want', 'need', 'help', 'can', 'you', 'the', 'a', 'an',
                    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
                    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
                    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'about',
                    'like', 'what', 'how', 'which', 'who', 'where', 'when', 'why', 'this',
                    'that', 'these', 'those', 'it', 'its', 'and', 'or', 'but', 'not', 'so',
                    'if', 'then', 'than', 'too', 'very', 'just', 'also', 'more', 'some',
                    'any', 'all', 'each', 'every', 'both', 'few', 'many', 'much', 'no',
                    'idea', 'ideas', 'project', 'projects', 'capstone', 'suggest', 'give',
                    'tell', 'show', 'find', 'get', 'make', 'think', 'know', 'good', 'best',
                ]);

                const keywords = message
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .split(/\s+/)
                    .filter(w => w.length > 2 && !stopWords.has(w));

                // Search for each keyword and combine results (deduplicated)
                const ideasMap = new Map<number, CapstoneIdea>();

                for (const keyword of keywords.slice(0, 5)) { // Limit to 5 keywords
                    try {
                        const found = await CapstoneRepository.searchIdeas(keyword, 10);
                        for (const idea of found) {
                            if (idea.id && !ideasMap.has(idea.id)) {
                                ideasMap.set(idea.id, idea);
                            }
                        }
                    } catch (err: any) {
                        logger.warn(`Failed to search ideas for keyword "${keyword}": ${err.message}`);
                    }
                }

                relevantIdeas = Array.from(ideasMap.values()).slice(0, 20); // Cap at 20 ideas for context
            }

            // If no keyword matches, get a random sample of ideas for general context
            if (relevantIdeas.length === 0) {
                try {
                    relevantIdeas = await CapstoneRepository.getAllIdeas(15);
                } catch (err: any) {
                    logger.warn(`Failed to get all ideas: ${err.message}`);
                }
            }

            // Build the system prompt with relevant ideas
            const systemPrompt = this.buildCapstoneSystemPrompt(relevantIdeas);

            // Convert history to ChatMessage format expected by AiProvider
            const chatHistory = history.map(msg => ({
                role: msg.role as "user" | "assistant" | "system",
                content: msg.content,
                createdAt: new Date()
            })) as any[];

            // Call the AI provider
            const response = await AiProvider.generateResponse(systemPrompt, chatHistory, message);

            return {
                text: response.text,
                tokensUsed: response.tokensUsed,
                ideasUsed: relevantIdeas.length
            };
        } catch (err: any) {
            logger.error(`Capstone AI chat failed: ${err.message}`);
            return {
                text: "I'm having trouble processing your request right now. Please try again in a moment.",
                tokensUsed: 0,
                ideasUsed: 0
            };
        }
    }

    /**
     * Seed the database with sample capstone ideas if empty.
     */
    static async seedIdeasIfEmpty(): Promise<void> {
        try {
            const count = await CapstoneRepository.getIdeasCount();
            if (count > 0) {
                logger.info(`CapstoneIdeas already has ${count} entries. Skipping seed.`);
                return;
            }

            logger.info("Seeding CapstoneIdeas with sample data...");

            const sampleIdeas = [
                {
                    title: "Smart Campus Navigation System",
                    description: "A mobile application that provides indoor navigation for campus buildings using Bluetooth beacons and AR overlays. Helps new students find classrooms, offices, and facilities.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "mobile,AR,IoT,navigation,bluetooth"
                },
                {
                    title: "AI-Powered Student Academic Advisor",
                    description: "An intelligent chatbot that helps students plan their academic journey, select courses, and optimize their schedule based on their GPA, preferences, and graduation requirements.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "AI,chatbot,NLP,academic,scheduling"
                },
                {
                    title: "University Event Management Platform",
                    description: "A web platform for organizing, promoting, and managing university events. Includes RSVP tracking, QR code check-in, and analytics dashboard for event organizers.",
                    faculty: "Engineering",
                    year: 2023,
                    tags: "web,events,QR,dashboard,management"
                },
                {
                    title: "Mental Health Support App for Students",
                    description: "A mobile app providing mental health resources, mood tracking, anonymous peer support forums, and crisis helpline integration specifically designed for university students.",
                    faculty: "Health Sciences",
                    year: 2024,
                    tags: "mobile,health,mental-health,wellness,community"
                },
                {
                    title: "Automated Exam Proctoring System",
                    description: "An AI-based system that monitors online exams using webcam analysis, detecting suspicious behavior patterns while respecting student privacy.",
                    faculty: "Engineering",
                    year: 2023,
                    tags: "AI,computer-vision,security,education,proctoring"
                },
                {
                    title: "Campus Food Delivery & Pre-Order System",
                    description: "A platform connecting campus cafeterias with students, allowing pre-ordering meals, tracking delivery, and managing dietary preferences to reduce wait times.",
                    faculty: "Business Administration",
                    year: 2023,
                    tags: "web,mobile,food,delivery,e-commerce"
                },
                {
                    title: "Library Resource Recommendation Engine",
                    description: "An ML-based system that recommends books, papers, and resources to students based on their courses, research interests, and borrowing history.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "ML,recommendation,library,NLP,data-science"
                },
                {
                    title: "Blockchain-Based Academic Credential Verification",
                    description: "A decentralized system for issuing and verifying academic certificates and transcripts using blockchain technology, preventing fraud and simplifying employer verification.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "blockchain,security,credentials,verification,web3"
                },
                {
                    title: "Smart Parking Management System",
                    description: "An IoT-based system using sensors and a mobile app to help students and staff find available parking spots on campus in real-time.",
                    faculty: "Engineering",
                    year: 2023,
                    tags: "IoT,mobile,sensors,parking,real-time"
                },
                {
                    title: "Student Budget & Financial Planning Tool",
                    description: "A web application helping students manage their finances, track expenses, set savings goals, and receive personalized financial advice based on their spending patterns.",
                    faculty: "Business Administration",
                    year: 2024,
                    tags: "web,finance,budgeting,analytics,personal-finance"
                },
                {
                    title: "Virtual Lab Simulation Platform",
                    description: "A web-based platform providing interactive 3D simulations of physics, chemistry, and biology lab experiments for remote learning scenarios.",
                    faculty: "Sciences",
                    year: 2023,
                    tags: "3D,simulation,education,WebGL,virtual-lab"
                },
                {
                    title: "Campus Safety Alert System",
                    description: "A real-time emergency notification system with panic button, GPS tracking, and automated alerts to campus security, integrated with the university's existing infrastructure.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "mobile,safety,GPS,real-time,emergency"
                },
                {
                    title: "Peer Tutoring Matchmaking Platform",
                    description: "A platform that matches students who need help in specific subjects with qualified peer tutors, including scheduling, rating system, and session tracking.",
                    faculty: "Education",
                    year: 2023,
                    tags: "web,education,matching,tutoring,peer-learning"
                },
                {
                    title: "Sustainable Campus Energy Dashboard",
                    description: "A real-time dashboard monitoring and visualizing energy consumption across campus buildings, with AI predictions for optimization and sustainability recommendations.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "IoT,dashboard,energy,sustainability,data-visualization"
                },
                {
                    title: "Arabic Natural Language Processing Toolkit",
                    description: "A comprehensive NLP toolkit for Arabic text processing including sentiment analysis, named entity recognition, and text summarization tailored for Lebanese Arabic dialect.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "NLP,Arabic,AI,ML,text-processing"
                },
                {
                    title: "Student Health Records Management System",
                    description: "A secure digital platform for managing student health records, vaccination tracking, and clinic appointments at the university health center.",
                    faculty: "Health Sciences",
                    year: 2023,
                    tags: "web,health,records,security,HIPAA"
                },
                {
                    title: "Interactive Campus Map with Accessibility Features",
                    description: "A web and mobile application providing detailed campus maps with accessibility routes for students with disabilities, including wheelchair paths and elevator locations.",
                    faculty: "Engineering",
                    year: 2023,
                    tags: "web,mobile,accessibility,maps,GIS"
                },
                {
                    title: "AI Resume Builder & Job Matcher",
                    description: "An intelligent platform that helps students build professional resumes using AI suggestions and matches them with relevant internship and job opportunities.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "AI,NLP,resume,career,job-matching"
                },
                {
                    title: "University Social Media Analytics Dashboard",
                    description: "A dashboard analyzing the university's social media presence across platforms, tracking engagement metrics, sentiment, and providing content strategy recommendations.",
                    faculty: "Mass Communication and Fine Arts",
                    year: 2024,
                    tags: "analytics,social-media,dashboard,NLP,marketing"
                },
                {
                    title: "Online Voting System for Student Elections",
                    description: "A secure, transparent online voting platform for student council elections with identity verification, real-time results, and audit trail capabilities.",
                    faculty: "Engineering",
                    year: 2023,
                    tags: "web,security,voting,authentication,democracy"
                },
                {
                    title: "Augmented Reality Campus Tour Guide",
                    description: "An AR mobile application that provides interactive campus tours for prospective students, overlaying information about buildings, history, and programs when pointing their phone.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "AR,mobile,tourism,3D,education"
                },
                {
                    title: "Course Review & Rating Platform",
                    description: "A platform where students can anonymously review and rate courses and instructors, helping future students make informed registration decisions.",
                    faculty: "Engineering",
                    year: 2023,
                    tags: "web,reviews,ratings,education,community"
                },
                {
                    title: "Waste Management & Recycling Tracker",
                    description: "An IoT-based system monitoring waste bins across campus with a mobile app for reporting, recycling gamification, and analytics for campus sustainability initiatives.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "IoT,sustainability,mobile,gamification,environment"
                },
                {
                    title: "Digital Signage Content Management System",
                    description: "A centralized platform for managing digital display screens across campus, enabling departments to schedule announcements, events, and emergency messages.",
                    faculty: "Mass Communication and Fine Arts",
                    year: 2023,
                    tags: "web,CMS,digital-signage,scheduling,communication"
                },
                {
                    title: "Internship Management & Tracking System",
                    description: "A comprehensive platform for managing the entire internship lifecycle — from company partnerships and student applications to supervisor evaluations and credit tracking.",
                    faculty: "Business Administration",
                    year: 2024,
                    tags: "web,internships,management,tracking,career"
                },
                {
                    title: "AI-Powered Plagiarism Detection for Arabic Text",
                    description: "A plagiarism detection system specifically designed for Arabic academic writing, using NLP techniques to identify copied content, paraphrasing, and citation issues.",
                    faculty: "Engineering",
                    year: 2024,
                    tags: "AI,NLP,Arabic,plagiarism,academic-integrity"
                },
                {
                    title: "Student Attendance Tracking with Face Recognition",
                    description: "An automated attendance system using facial recognition technology to track student presence in lectures, with privacy-conscious design and opt-out options.",
                    faculty: "Engineering",
                    year: 2023,
                    tags: "AI,computer-vision,attendance,biometrics,privacy"
                },
                {
                    title: "E-Learning Content Accessibility Converter",
                    description: "A tool that automatically converts educational content into accessible formats — adding captions to videos, alt-text to images, and converting PDFs to screen-reader-friendly formats.",
                    faculty: "Education",
                    year: 2024,
                    tags: "accessibility,education,AI,automation,inclusive-design"
                },
                {
                    title: "Research Collaboration Network",
                    description: "A platform connecting researchers across departments for interdisciplinary collaboration, project matching, resource sharing, and publication tracking.",
                    faculty: "Sciences",
                    year: 2024,
                    tags: "web,research,collaboration,networking,academic"
                },
                {
                    title: "Smart Classroom Environment Controller",
                    description: "An IoT system that automatically adjusts lighting, temperature, and ventilation in classrooms based on occupancy, time of day, and weather conditions for optimal learning.",
                    faculty: "Engineering",
                    year: 2023,
                    tags: "IoT,smart-building,automation,sensors,comfort"
                }
            ];

            const inserted = await CapstoneRepository.bulkInsertIdeas(sampleIdeas);
            logger.info(`Seeded ${inserted}/${sampleIdeas.length} capstone ideas.`);
        } catch (err: any) {
            logger.error(`Failed to seed capstone ideas: ${err.message}`);
        }
    }
}