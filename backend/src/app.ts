import express from "express";
import cors from "cors";
import pool from "./core/database/connection";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("MuGate Backend Running 🚀");
});

// Test DB connection
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.request().query("SELECT 1 AS test");
        res.json({ success: true, result: result.recordset });
    } catch (err) {
        res.json({ success: false, error: err });
    }
});

export default app;
