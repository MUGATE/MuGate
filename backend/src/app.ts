import express from "express";
import cors from "cors";
import { pool, poolConnect } from "./core/database/connection";
import { errorMiddleware } from "./core/middleware/error.middleware";
import { rateLimiter } from "./core/middleware/rateLimiter.middleware";
import authRoutes from "./modules/auth/auth.routes";
import historyRoutes from "./modules/history/history.routes";
import coursesRoutes from "./modules/academic/courses/courses.routes";
import { generatorRoutes } from "./modules/scheduling/generator/generator.routes";
import schedulesRoutes from "./modules/academic/schedules/schedules.routes";
import chatbotRoutes from "./modules/ai/chatbot/routes/chatbot.routes";
import scraperRoutes from "./modules/system/scraper/scraper.routes";
import { initCronJobs } from "./modules/system/sync/sync.cron";
import resumeRoutes from "./modules/resume/resume.routes";
import internshipRoutes from "./modules/internships/internship.routes";
import { InternshipRepository } from "./modules/internships/internship.repository";
import capstoneRoutes from "./modules/capstone/capstone.routes";
import { CapstoneRepository } from "./modules/capstone/capstone.repository";
import { CapstoneService } from "./modules/capstone/capstone.service";
import eventRoutes from "./modules/events/event.routes";
import { EventRepository } from "./modules/events/event.repository";
import roadmapRoutes from "./modules/roadmap/roadmap.routes";
import { RoadMapRepository } from "./modules/roadmap/roadmap.repository";
import { bootstrapRag } from "./modules/ai/rag/rag.bootstrap";
import { env } from "./config/env";

const app = express();

app.set("trust proxy", 1);

app.use(
    cors({
        origin: (origin, callback) => {
            // Non-browser clients (mobile apps, curl) send no Origin
            if (!origin) return callback(null, true);
            if (env.corsOrigins.length === 0) {
                // Dev fallback: allow all when CORS_ORIGINS unset
                if (env.nodeEnv !== "production") return callback(null, true);
                return callback(null, false);
            }
            if (env.corsOrigins.includes(origin)) return callback(null, true);
            return callback(null, false);
        },
        credentials: true,
    })
);
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ limit: "8mb", extended: true }));
app.use(rateLimiter);

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/generate", generatorRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/chatbot", chatbotRoutes);   // MuChat integration
app.use("/api/scraper", scraperRoutes);   // Scraper & Knowledge Base
app.use("/api/resume", resumeRoutes);
app.use("/api/internships", internshipRoutes); // Internship reviews
app.use("/api/capstone", capstoneRoutes);       // Capstone partner matching & AI ideas
app.use("/api/events", eventRoutes);             // Events discovery & scraping
app.use("/api/roadmap", roadmapRoutes);          // Interactive Degree RoadMap

// Helper route for checking auth route in browser
app.get("/api/auth/login", (req, res) => {
    res.status(405).json({ success: false, message: "Login requires a POST request with email and password." });
});

app.get("/", (req, res) => {
    res.send("MuGate Backend Running 🚀");
});

/** Railway / load-balancer healthcheck */
app.get("/api/health", async (_req, res) => {
    try {
        await poolConnect;
        await pool.request().query("SELECT 1 AS ok");
        res.status(200).json({ ok: true, db: true });
    } catch (err: any) {
        res.status(503).json({
            ok: false,
            db: false,
            error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }
});

// Global Error Handler (must be the last middleware)
app.use(errorMiddleware);

// Ensure InternshipReviews table exists
InternshipRepository.ensureTable();

// Ensure Capstone tables exist and seed ideas
CapstoneRepository.ensureTables().then(() => CapstoneService.seedIdeasIfEmpty());

// Ensure Events table exists
EventRepository.ensureTable();

// Ensure RoadMap table exists
RoadMapRepository.ensureTable();

// Initialize background CRON jobs
initCronJobs();

// RAG bootstrap: migrations applied via poolConnect; seed, vector sync, optional crawl
poolConnect.then(() => bootstrapRag()).catch(err => {
    console.error("RAG bootstrap error:", err.message);
});
export default app;
