// Tag registry for the blog.
// Each tag carries the accent color used for carousel card outlines, hashtag
// text, and the post page's title border. Add a new tag here FIRST — the
// content schema (src/content.config.ts) only accepts tags listed here, so a
// typo'd tag in a post's frontmatter fails the build with a clear error
// instead of silently rendering uncolored.
export const TAGS = {
  manifesto: "#c89cfb",
  cybersecurity: "#63cfb7",
  anecdote: "#be6de6",
  writeup: "#a49aff",
};

export const TAG_NAMES = Object.keys(TAGS);
