export const buildNoteUrl = (data: {
  handle: string;
  noteId: string;
  isComment?: boolean;
}) => {
  const noteIdWithCDash = data.noteId.includes("c-")
    ? data.noteId
    : `c-${data.noteId}`;
  return `https://substack.com/@${data.handle}/note/${noteIdWithCDash}`;
};

export const buildCreatorUrl = (data: { handle: string }) => {
  return `https://substack.com/@${data.handle}`;
};
