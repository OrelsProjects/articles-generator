/**
 * Formatting includes:
 * * Replacing a single \n to \n\n
 * @param notes
 * @returns
 */

export function formatNote<T extends { body: string }>(note: T) {
  return {
    ...note,
    body: note.body.replace(/\n/g, "\n\n"),
  };
}

export function formatNotes<T extends { body: string }>(notes: T[]) {
  return notes.map(formatNote);
}
