// Content collections config (Astro content layer).
//
// The blog lives in src/content/blog/ as one markdown file per post, so posts
// can be written/edited from a phone with the GitHub mobile app: edit or add
// a .md file, commit to `nexus`, and the deploy runner publishes it.
//
// The zod schema below validates every post's frontmatter AT BUILD TIME —
// a typo made on a phone keyboard (bad date, unknown tag, missing title)
// fails the build with a readable error instead of shipping a broken post.
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { TAG_NAMES } from "./data/tags.js";

const blog = defineCollection({
  // The file name (minus .md) IS the slug: src/content/blog/why-all-of-this.md
  // -> /blog/why-all-of-this. Renaming a file changes its URL — don't rename
  // published posts.
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().min(1, "title is required"),
    // Accepts a bare YAML date (2026-06-21) or a quoted string; anything that
    // isn't a real date fails the build.
    date: z.coerce.date({
      errorMap: () => ({ message: "date must be a valid date like 2026-06-21" }),
    }),
    // Only tags registered in src/data/tags.js are allowed (typo protection).
    tags: z
      .array(z.enum(TAG_NAMES as [string, ...string[]]))
      .nonempty(`tags must include at least one of: ${TAG_NAMES.join(", ")}`),
    // Short teaser shown on carousel cards and used as the post page's
    // meta description.
    excerpt: z.string().min(1, "excerpt is required"),
    // draft: true  -> post still publishes but is visibly marked as a draft
    // (chip in the index/carousel + note on the post page). Omit or set to
    // false when the copy is real.
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
