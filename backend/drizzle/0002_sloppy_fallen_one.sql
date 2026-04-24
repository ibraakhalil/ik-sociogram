CREATE TABLE `replies` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `replies_comment_id_idx` ON `replies` (`comment_id`);--> statement-breakpoint
CREATE INDEX `replies_author_id_idx` ON `replies` (`author_id`);--> statement-breakpoint
WITH RECURSIVE `comment_roots`(`id`, `root_comment_id`) AS (
	SELECT `id`, `id`
	FROM `comments`
	WHERE `parent_id` IS NULL
	UNION ALL
	SELECT `child`.`id`, `comment_roots`.`root_comment_id`
	FROM `comments` AS `child`
	INNER JOIN `comment_roots` ON `child`.`parent_id` = `comment_roots`.`id`
)
INSERT INTO `replies`("id", "comment_id", "author_id", "content", "created_at")
SELECT
	`comments`.`id`,
	`comment_roots`.`root_comment_id`,
	`comments`.`author_id`,
	`comments`.`content`,
	`comments`.`created_at`
FROM `comments`
INNER JOIN `comment_roots` ON `comment_roots`.`id` = `comments`.`id`
WHERE `comments`.`parent_id` IS NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "post_id", "author_id", "content", "created_at")
SELECT "id", "post_id", "author_id", "content", "created_at"
FROM `comments`
WHERE `parent_id` IS NULL;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `comments_post_id_idx` ON `comments` (`post_id`);--> statement-breakpoint
CREATE TABLE `__new_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_id` text NOT NULL,
	`target_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "likes_target_type_check" CHECK("__new_likes"."target_type" in ('post', 'comment', 'reply'))
);
--> statement-breakpoint
INSERT INTO `__new_likes`("id", "user_id", "target_id", "target_type", "created_at")
SELECT
	"likes"."id",
	"likes"."user_id",
	"likes"."target_id",
	CASE
		WHEN "likes"."target_type" = 'comment'
			AND EXISTS (
				SELECT 1
				FROM `replies`
				WHERE `replies`.`id` = "likes"."target_id"
			)
		THEN 'reply'
		ELSE "likes"."target_type"
	END,
	"likes"."created_at"
FROM `likes`;--> statement-breakpoint
DROP TABLE `likes`;--> statement-breakpoint
ALTER TABLE `__new_likes` RENAME TO `likes`;--> statement-breakpoint
CREATE UNIQUE INDEX `likes_user_target_unique_idx` ON `likes` (`user_id`,`target_id`,`target_type`);--> statement-breakpoint
CREATE INDEX `likes_target_id_idx` ON `likes` (`target_id`);--> statement-breakpoint
CREATE INDEX `likes_user_id_idx` ON `likes` (`user_id`);
