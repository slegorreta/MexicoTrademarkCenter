export interface BlogPost {
  slug: string;
  lang: string;
  title: string;
  metaDescription: string;
  publishDate: string;
  readTime: number;
  content: string;
}

export const blogPosts: BlogPost[] = [];
