// types/community.d.ts

export interface CommunityPost {
    id: string;
    authorId: string;
    authorName: string;
    message: string;
    timestamp: number;
    likes?: number;
  }
  