export type ApiErrorResponse = {
  error: string;
};

export type ApiUser = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

export type FeedPost = {
  author: ApiUser;
  commentCount: number;
  contentText: string | null;
  createdAt: string;
  id: string;
  imageUrl: string | null;
  isLiked: boolean;
  likeCount: number;
  visibility: "public" | "private";
};

export type FeedResponse = {
  items: FeedPost[];
  nextCursor: string | null;
};

export type LikesResponse = {
  items: ApiUser[];
};

export type ProfileUser = ApiUser & {
  createdAt: string;
};

export type ProfileStats = {
  postCount: number;
  privatePostCount: number;
  publicPostCount: number;
  totalCommentCount: number;
};

export type ProfileResponse = {
  isCurrentUser: boolean;
  stats: ProfileStats;
  user: ProfileUser;
  viewerCanSeePrivatePosts: boolean;
};

export type CommentItem = {
  author: ApiUser;
  content: string;
  createdAt: string;
  id: string;
  isLiked: boolean;
  likeCount: number;
  replies: ReplyItem[];
};

export type ReplyItem = {
  author: ApiUser;
  commentId: string;
  content: string;
  createdAt: string;
  id: string;
  isLiked: boolean;
  likeCount: number;
};

export type CommentsResponse = {
  items: CommentItem[];
};
