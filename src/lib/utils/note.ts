export const buildNoteUrl = (data: {
  handle: string;
  noteId: string;
  isComment?: boolean;
}) => {
  return `https://substack.com/@${data.handle}/note/${data.noteId}${
    data.isComment ? `#comments` : ""
  }`;
};

export const buildCreatorUrl = (data: {
  handle: string;
}) => {
  return `https://substack.com/@${data.handle}`;
};