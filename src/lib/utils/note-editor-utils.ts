import { unformatText } from "@/lib/utils/text-editor";
import { NoteDraft } from "@/types/note";
import { compareTwoStrings } from "string-similarity";

export const isPlagiarism = (
  html: string,
  selectedNote: NoteDraft,
  authorId: number | null,
) => {
  if (authorId !== null && authorId === selectedNote.authorId) {
    return false; // don't check plagiarism for your own notes
  }
  const { body } = selectedNote;
  const unformattedBody = unformatText(html);
  const unformattedNoteBody = unformatText(body);

  const similarity = compareTwoStrings(unformattedBody, unformattedNoteBody);

  const isSimilar = similarity > 0.85; // tweak this threshold as needed

  return isSimilar && selectedNote?.status === "inspiration";
};

// Link might also appear as (...link...)[...text...], so need to remove the brackets
export const getLinks = (body: string): string[] => {
  const links: string[] = [];

  const regex = /\((https?:\/\/[^\s)]+)\)/g;
  let match;

  while ((match = regex.exec(body)) !== null) {
    try {
      const url = new URL(match[1]);
      links.push(`${url.origin}${url.pathname}${url.search}`);
    } catch (e) {
      // skip invalid URLs
    }
  }

  return links;
};
