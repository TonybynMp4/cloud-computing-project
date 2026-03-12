import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import fileRoutes from "./routes/files.js";

const app = express();
const PORT = Number(process.env["PORT"] ?? 3000);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env["CORS_ORIGIN"] ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
