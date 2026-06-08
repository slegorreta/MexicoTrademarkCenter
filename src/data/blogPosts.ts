export interface BlogPost {
  slug: string;
  lang: string;
  title: string;
  metaDescription: string;
  publishDate: string;
  readTime: number;
  content: string;
}

import { enPosts } from './blogPosts.en';
import { esPosts } from './blogPosts.es';
import { dePosts } from './blogPosts.de';
import { frPosts } from './blogPosts.fr';
import { zhPosts } from './blogPosts.zh';
import { jaPosts } from './blogPosts.ja';
import { hiPosts } from './blogPosts.hi';
import { ptPosts } from './blogPosts.pt';

export const blogPosts: BlogPost[] = [
  ...enPosts,
  ...esPosts,
  ...dePosts,
  ...frPosts,
  ...zhPosts,
  ...jaPosts,
  ...hiPosts,
  ...ptPosts,
];
