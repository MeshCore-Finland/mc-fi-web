import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import english from './content/i18n/en.json';

// Quoted calendar dates document an actual human review, not a file modification.
const reviewDate = z.iso.date().optional();
const uiShape = Object.fromEntries(
  Object.keys(english).map((key) => [key, z.string()]),
) as Record<keyof typeof english, z.ZodString>;

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        faq: z.boolean().default(false),
        lastReviewed: reviewDate,
        translationChecked: reviewDate,
        hidePageTitle: z.boolean().default(false),
      }),
    }),
  }),
  i18n: defineCollection({
    loader: i18nLoader(),
    schema: i18nSchema({ extend: z.object(uiShape) }),
  }),
};
