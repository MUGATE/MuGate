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

const app = express();

app.use(cors());
app.use(express.json());
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

// Test DB connection
app.get("/test-db", async (req, res) => {
    try {
        await poolConnect; // Wait for connection to establish
        const result = await pool.request().query("SELECT 1 AS test");
        res.json({ success: true, result: result.recordset });
    } catch (err: any) {
        res.json({ success: false, error: err.message });
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

export default app;
