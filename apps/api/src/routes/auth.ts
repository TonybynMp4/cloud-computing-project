import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod/v4";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import type { AuthPayload } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env["JWT_SECRET"]!;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env["COOKIE_SECURE"] === "true",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

const registerSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { username, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const [inserted] = await db
    .insert(users)
    .values({ username, passwordHash })
    .$returningId();

  const payload: AuthPayload = { userId: inserted!.id, username };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({ id: inserted!.id, username });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { username, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const payload: AuthPayload = { userId: user.id, username: user.username };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  res.cookie("token", token, COOKIE_OPTIONS);
  res.json({ id: user.id, username: user.username });
});

router.post("/logout", (_req, res) => {
  res.cookie("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: "Logged out" });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

export default router;