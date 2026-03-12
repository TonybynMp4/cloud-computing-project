import { and, eq } from "drizzle-orm";
import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { files } from "../db/schema.js";
import { deleteBlob, downloadBlob, uploadBlob } from "../lib/storage.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authMiddleware);

router.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const userId = req.user!.userId;
  const blobName = `${userId}/${Date.now()}-${uuidv4()}-${file.originalname}`;

  await uploadBlob(blobName, file.buffer, file.mimetype);

  const [inserted] = await db
    .insert(files)
    .values({
      userId,
      originalName: file.originalname,
      blobName,
      contentType: file.mimetype,
      sizeBytes: file.size,
    })
    .$returningId();

  const record = await db.query.files.findFirst({
    where: eq(files.id, inserted!.id),
  });

  res.status(201).json(record);
});

router.get("/", async (req, res) => {
  const userId = req.user!.userId;

  const userFiles = await db.query.files.findMany({
    where: eq(files.userId, userId),
    orderBy: (files, { desc }) => [desc(files.createdAt)],
  });

  res.json(userFiles);
});

router.get("/:id/download", async (req, res) => {
  const userId = req.user!.userId;
  const fileId = req.params["id"]!;

  const file = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.userId, userId)),
  });

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const stream = await downloadBlob(file.blobName);

  const disposition = req.query["inline"] === "1" ? "inline" : "attachment";

  res.setHeader("Content-Type", file.contentType);
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${encodeURIComponent(file.originalName)}"`,
  );

  stream.pipe(res);
});

router.delete("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const fileId = req.params["id"]!;

  const file = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.userId, userId)),
  });

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  await deleteBlob(file.blobName);
  await db.delete(files).where(eq(files.id, fileId));

  res.json({ message: "File deleted" });
});

export default router;