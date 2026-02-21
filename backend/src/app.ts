import express from "express";
import cors from "cors";
import { pool, poolConnect } from "./core/database/connection";
import { errorMiddleware } from "./core/middleware/error.middleware";
import { rateLimiter } from "./core/middleware/rateLimiter.middleware";
import authRoutes from "./modules/auth/auth.routes";
import historyRoutes from "./modules/history/history.routes";
import coursesRoutes from "./modules/courses/courses.routes";
import { generatorRoutes } from "./modules/generator/generator.routes";
import schedulesRoutes from "./modules/schedules/schedules.routes";
import { initCronJobs } from "./modules/sync/sync.cron";

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

// Initialize background CRON jobs
initCronJobs();

export default app;
