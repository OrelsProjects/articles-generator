export const appName = process.env.NEXT_PUBLIC_APP_NAME;

const ONE_HOUR_IN_MS = 1000 * 60 * 60;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;

//    FILES    //
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB

//    DATA-FETCHING    //
export const NOTES_STATS_FETCHING_INTERVAL = ONE_HOUR_IN_MS * 12; // 12 hours
export const NOTES_FETCHING_INTERVAL = ONE_HOUR_IN_MS * 12; // 12 hours

// Two weeks ago
export const NOTES_STATS_FETCHING_EARLIEST_DATE = new Date(
  Date.now() - 14 * ONE_DAY_IN_MS,
);

export const MIN_EXTENSION_TO_UPLOAD_LINK = "1.3.98"