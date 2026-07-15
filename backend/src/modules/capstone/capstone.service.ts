import { CapstoneRepository, CapstoneIdea } from "./capstone.repository";
import { AiProvider } from "../ai/chatbot/ai/ai.provider";
import { logger } from "../../core/logger/logger";
import { pool, poolConnect } from "../../core/database/connection";
import * as fs from "fs";
import * as path from "path";

/**
 * Capstone Service — handles AI-powered idea suggestions and partner matching logic.
 */
export class CapstoneService {

    private static readonly STOP_WORDS = new Set([
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
        'please', 'something', 'anything', 'interested', 'looking', 'would',
    ]);

  private static readonly DOMAIN_EXPANSIONS: Record<string, string[]> = {
        ai: ['ai', 'machine', 'learning', 'neural', 'deep', 'intelligent', 'prediction'],
        ml: ['machine', 'learning', 'ai', 'model', 'prediction'],
        iot: ['iot', 'smart', 'sensor', 'internet', 'things', 'automation'],
        health: ['health', 'medical', 'healthcare', 'patient', 'clinical', 'hospital', 'doctor'],
        web: ['web', 'website', 'application', 'platform', 'portal'],
        mobile: ['mobile', 'app', 'application', 'android', 'ios'],
        ecommerce: ['ecommerce', 'store', 'shop', 'marketplace', 'commerce', 'retail'],
        game: ['game', 'gaming', 'video', 'horror', 'npc'],
        education: ['education', 'learning', 'student', 'university', 'course', 'tutoring'],
        security: ['security', 'pentest', 'intrusion', 'detection', 'cyber'],
        blockchain: ['blockchain', 'crypto', 'decentralized'],
        fitness: ['fitness', 'gym', 'workout', 'diet', 'muscle'],
        food: ['food', 'restaurant', 'delivery', 'meal', 'cooking'],
        car: ['car', 'vehicle', 'automotive', 'parking', 'transport'],
    };

    private static extractKeywords(...texts: string[]): string[] {
        const keywords = new Set<string>();

        for (const text of texts) {
            const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
            for (const word of normalized.split(/\s+/)) {
                if (word.length >= 2 && !this.STOP_WORDS.has(word)) {
                    keywords.add(word);
                }
            }
        }

        for (const word of Array.from(keywords)) {
            const expansions = this.DOMAIN_EXPANSIONS[word];
            if (expansions) {
                for (const term of expansions) {
                    keywords.add(term);
                }
            }
        }

        return Array.from(keywords);
    }

    private static async findRelevantIdeas(
        message: string,
        history: Array<{ role: string; content: string }> = []
    ): Promise<CapstoneIdea[]> {
        const recentUserMessages = history
            .filter(msg => msg.role === 'user')
            .slice(-4)
            .map(msg => msg.content);

        const searchTexts = [...recentUserMessages, message];
        const keywords = this.extractKeywords(...searchTexts);
        const ideasMap = new Map<number, CapstoneIdea>();

        const addIdeas = (ideas: CapstoneIdea[]) => {
            for (const idea of ideas) {
                if (idea.id && !ideasMap.has(idea.id)) {
                    ideasMap.set(idea.id, idea);
                }
            }
        };

        for (const keyword of keywords.slice(0, 10)) {
            try {
                addIdeas(await CapstoneRepository.searchIdeas(keyword, 15));
            } catch (err: any) {
                logger.warn(`Failed to search ideas for keyword "${keyword}": ${err.message}`);
            }
        }

        const combinedQuery = searchTexts.join(' ').trim();
        if (combinedQuery.length >= 8) {
            try {
                addIdeas(await CapstoneRepository.searchIdeas(combinedQuery.slice(0, 120), 20));
            } catch (err: any) {
                logger.warn(`Failed to search ideas for combined query: ${err.message}`);
            }
        }

        let relevantIdeas = Array.from(ideasMap.values());

        if (relevantIdeas.length < 35) {
            try {
                const supplement = await CapstoneRepository.getAllIdeas(60);
                for (const idea of supplement) {
                    if (idea.id && !ideasMap.has(idea.id)) {
                        ideasMap.set(idea.id, idea);
                    }
                    if (ideasMap.size >= 50) break;
                }
                relevantIdeas = Array.from(ideasMap.values());
            } catch (err: any) {
                logger.warn(`Failed to supplement ideas from database: ${err.message}`);
            }
        }

        return relevantIdeas.slice(0, 50);
    }

    /**
     * Generate the system prompt for the Capstone AI advisor.
     * Includes relevant capstone ideas from the database as context.
     */
    static buildCapstoneSystemPrompt(ideas: CapstoneIdea[], conversationContext: string = ""): string {
        let prompt = `You are the Capstone Project Advisor AI for MuGate — the student portal for Al Maaref University (MU) in Lebanon. Your role is to help students brainstorm, refine, and develop capstone project ideas.

CORE RULES:
1. Be creative, encouraging, and constructive. Help students think through their ideas.
2. When suggesting ideas, draw from the database of past capstone projects provided below — cite real project titles when relevant.
3. If a student has a niche in mind, find the most relevant past projects and suggest variations or improvements.
4. Help students refine their ideas by asking clarifying questions about scope, technology, feasibility, and impact.
5. Suggest project titles, brief descriptions, potential technologies, and expected outcomes.
6. Be concise but thorough. Use numbered lists for multiple suggestions.
7. Do NOT fabricate specific university policies or requirements.
8. Keep responses conversational and student-friendly.
9. If the student's idea is outside the scope of capstone projects, gently redirect them.
10. Prefer referencing MU's historical CSC 499 projects over generic suggestions whenever a close match exists.
`;

        if (ideas.length > 0) {
            prompt += `
HISTORICAL CAPSTONE PROJECT IDEAS DATABASE (${ideas.length} relevant past MU projects loaded for this conversation):
The following are real past CSC 499 capstone project ideas from Al Maaref University. Use these as your primary source when helping students. Reference specific titles, semesters (from tags), and descriptions when making recommendations.

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
    ): Promise<{ text: string; tokensUsed: number; ideasUsed: number; error?: boolean }> {
        try {
            const relevantIdeas = await this.findRelevantIdeas(message, history);
            logger.info(`Capstone AI chat: loaded ${relevantIdeas.length} ideas for context`);

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
                ideasUsed: 0,
                error: true,
            };
        }
    }

    /**
     * Sync CSC 499 historical capstone ideas from the bundled text file into the database.
     * Inserts only missing rows (matched by title + description); safe to run on every startup.
     */
    static async seedIdeasIfEmpty(): Promise<void> {
        try {
            // Self-healing deduplication CTE to clean up any parallel race conditions or legacy duplicates
            await poolConnect;
            const dedupResult = await pool.request().query(`
                WITH CTE AS (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY title, CAST(description AS NVARCHAR(1000)) 
                               ORDER BY id
                           ) AS RN
                    FROM CapstoneIdeas
                )
                DELETE FROM CapstoneIdeas
                WHERE id IN (SELECT id FROM CTE WHERE RN > 1);
            `);
            if (dedupResult.rowsAffected[0] && dedupResult.rowsAffected[0] > 0) {
                logger.info(`Self-healed CapstoneIdeas table: deleted ${dedupResult.rowsAffected[0]} duplicate rows.`);
            }

            const countBefore = await CapstoneRepository.getIdeasCount();
            logger.info(`Syncing CSC 499 capstone ideas (${countBefore} existing entries)...`);

            logger.info("Locating and parsing CSC_499_Projects_All_Semesters.txt...");

            let rawText = "";
            const pathsToTry = [
                path.join(__dirname, "../../../../../frontend/src/pages/Capstone/CSC_499_Projects_All_Semesters.txt"),
                path.join(__dirname, "../../../../frontend/src/pages/Capstone/CSC_499_Projects_All_Semesters.txt"),
                path.join(process.cwd(), "frontend/src/pages/Capstone/CSC_499_Projects_All_Semesters.txt"),
                path.join(process.cwd(), "../frontend/src/pages/Capstone/CSC_499_Projects_All_Semesters.txt"),
                path.join(process.cwd(), "src/pages/Capstone/CSC_499_Projects_All_Semesters.txt")
            ];

            for (const p of pathsToTry) {
                if (fs.existsSync(p)) {
                    rawText = fs.readFileSync(p, "utf-8");
                    logger.info(`Successfully loaded projects text file from: ${p}`);
                    break;
                }
            }

            if (!rawText) {
                logger.warn("CSC_499_Projects_All_Semesters.txt not found — no historical capstone ideas to sync.");
                return;
            }

            const parsedIdeas: any[] = [];
            const lines = rawText.split('\n');
            let currentSemester = '';
            let currentTitle = '';
            let currentDesc = '';

            for (const line of lines) {
                const semesterMatch = line.match(/──\s*(FALL|SPRING)\s*(\d{4})\s*──/i);
                if (semesterMatch) {
                    currentSemester = `${semesterMatch[2]} ${semesterMatch[1]}`;
                    continue;
                }

                const titleMatch = line.match(/^\s*\d+\.\s+(.+?)\s*$/);
                if (titleMatch) {
                    if (currentTitle && currentDesc) {
                        parsedIdeas.push({ semester: currentSemester, title: currentTitle, description: currentDesc });
                    }
                    currentTitle = titleMatch[1].trim();
                    currentDesc = '';
                    continue;
                }

                const descMatch = line.match(/^\s{4}(.+)$/);
                if (descMatch && currentTitle) {
                    currentDesc = descMatch[1].trim();
                    continue;
                }
            }

            if (currentTitle && currentDesc) {
                parsedIdeas.push({ semester: currentSemester, title: currentTitle, description: currentDesc });
            }

            logger.info(`Parsed ${parsedIdeas.length} projects from CSC_499_Projects_All_Semesters.txt`);

            // Map parsed ideas to CapstoneIdea schema
            const dbIdeas = parsedIdeas.map(p => {
                const yearMatch = p.semester ? p.semester.match(/^(\d{4})/) : null;
                const year = yearMatch ? parseInt(yearMatch[1], 10) : 2024;
                return {
                    title: p.title,
                    description: p.description,
                    faculty: "Sciences",
                    year: year,
                    tags: "CSC 499, " + (p.semester || "General")
                };
            });

            // 10 custom sample projects
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
                }
            ];

            // Combine parsed ideas with custom ones
            const finalIdeas = [...dbIdeas];

            logger.info(`Total ideas to insert: ${finalIdeas.length}`);

            const inserted = await CapstoneRepository.bulkInsertIdeas(finalIdeas);
            const countAfter = await CapstoneRepository.getIdeasCount();
            logger.info(`CSC 499 sync complete: inserted ${inserted} new ideas (${countAfter} total in database).`);

            // Self-healing deduplication CTE to clean up any parallel race conditions
            await poolConnect;
            await pool.request().query(`
                WITH CTE AS (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY title, CAST(description AS NVARCHAR(1000)) 
                               ORDER BY id
                           ) AS RN
                    FROM CapstoneIdeas
                )
                DELETE FROM CapstoneIdeas
                WHERE id IN (SELECT id FROM CTE WHERE RN > 1);
            `);
            logger.info("CapstoneIdeas database self-healed and deduplicated.");
        } catch (err: any) {
            logger.error(`Failed to seed capstone ideas: ${err.message}`);
        }
    }
}