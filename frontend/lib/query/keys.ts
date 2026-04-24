export const feedKeys = {
  all: ["feed"] as const,
  commentReactions: (commentId: string) => ["feed", "comment", commentId, "reactions"] as const,
  comments: (postId: string) => ["feed", "post", postId, "comments"] as const,
  home: () => ["feed", "lists", "home"] as const,
  lists: () => ["feed", "lists"] as const,
  postReactions: (postId: string) => ["feed", "post", postId, "reactions"] as const,
  profile: (userId?: string) => ["feed", "lists", "profile", userId ?? "me"] as const,
  replyReactions: (replyId: string) => ["feed", "reply", replyId, "reactions"] as const,
};

export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId?: string) => ["profile", "detail", userId ?? "me"] as const,
};
