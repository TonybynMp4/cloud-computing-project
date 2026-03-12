import { relations } from "drizzle-orm";
import {
    char,
    int,
    mysqlTable,
    timestamp,
    varchar,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";

export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(uuidv4),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = mysqlTable("files", {
  id: char("id", { length: 36 }).primaryKey().$defaultFn(uuidv4),
  userId: char("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  blobName: varchar("blob_name", { length: 512 }).notNull().unique(),
  contentType: varchar("content_type", { length: 127 }).notNull(),
  sizeBytes: int("size_bytes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
}));
