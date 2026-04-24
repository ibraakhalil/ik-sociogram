import { sql } from "drizzle-orm";
import { check, index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { users } from "@/db/schama/users";

export const likes = sqliteTable(
  "likes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetId: text("target_id").notNull(),
    targetType: text("target_type", { enum: ["post", "comment", "reply"] }).notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("likes_user_target_unique_idx").on(table.userId, table.targetId, table.targetType),
    index("likes_target_id_idx").on(table.targetId),
    index("likes_user_id_idx").on(table.userId),
    check("likes_target_type_check", sql`${table.targetType} in ('post', 'comment', 'reply')`),
  ],
);
