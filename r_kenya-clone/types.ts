export interface Post {
  id: string;
  subreddit: string;
  author: string;
  title: string;
  content?: string;
  image?: string;
  upvotes: number;
  comments: number;
  timeAgo: string;
  flair?: {
    text: string;
    color: string;
    textColor?: string;
  };
  isSponsored?: boolean;
}

export interface SidebarRule {
  id: number;
  title: string;
  description?: string;
}

export interface Flair {
  id: string;
  text: string;
  bg: string;
}
