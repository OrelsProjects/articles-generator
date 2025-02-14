export const cleanArticleBody = (body: string) => {
  // Remove nested image links with alt text and URLs
  // Remove standalone image markdown
  // Replace markdown links with just the text content
  // Replace raw URLs with <url>
  // Remove substack subscription text
  return body
    .replace(/\[[\s\n]*!\[.*?\]\(.*?\)[\s\n]*\]\(.*?\)/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "<alt>")
    .replace(/https?:\/\/[^\s<>]+/g, "<url>")
    .replace(/Thanks for reading.*?support my work[\s\S]*?/g, "")
    .trim();
};