import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(), shortDescription: z.string(), category: z.string(),
    technologies: z.array(z.string()), themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    githubUrl: z.url(), displayOrder: z.number(),
  }),
});
export const collections = { projects };
