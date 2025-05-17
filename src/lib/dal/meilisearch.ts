import { MeiliSearch } from "meilisearch";
import { NotesComments } from "../../../prisma/generated/articles";
import { DBNote } from "@/types/note";

const KEY = process.env.MEILISEARCH_API_KEY as string;
const HOST = process.env.MEILISEARCH_HOST as string;

export const client = new MeiliSearch({
  host: HOST,
  apiKey: KEY,
});

interface SearchMeiliOptions {
  keyword?: string;
  filters?: {
    minLikes?: number;
    minComments?: number;
    minRestacks?: number;
    dateRange?: {
      from: string;
      to?: string;
    };
  };
  existingNotesIds?: string[];
  limit?: number;
  page?: number;
}

export async function searchInMeili({
  keyword,
  filters,
  existingNotesIds = [],
  limit = 500,
  page = 1,
}: SearchMeiliOptions): Promise<NotesComments[]> {
  try {
    const meiliIndex = client.index("notes");

    const meiliFilters: string[] = [];

    if (filters?.minLikes)
      meiliFilters.push(`reaction_count >= ${filters.minLikes}`);
    if (filters?.minComments)
      meiliFilters.push(`children_count >= ${filters.minComments}`);
    if (filters?.minRestacks)
      meiliFilters.push(`restacks >= ${filters.minRestacks}`);
    if (filters?.dateRange?.from)
      meiliFilters.push(
        `date >= ${new Date(filters.dateRange.from).getTime()}`,
      );
    if (filters?.dateRange?.to)
      meiliFilters.push(`date <= ${new Date(filters.dateRange.to).getTime()}`);

    // Meili can't filter "not in" natively — filter client-side
    const meiliQuery = {
      q: keyword || "", // fallback to empty string
      filter: meiliFilters.length > 0 ? meiliFilters.join(" AND ") : undefined,
      sort: ["reaction_count:desc"],
      limit: limit + existingNotesIds.length, // extra rows for client-side filtering
    };

    console.time("meili - search");

    const { hits } = await meiliIndex.search<DBNote>(meiliQuery.q, {
      filter: meiliQuery.filter,
      sort: meiliQuery.sort,
      limit: meiliQuery.limit,
      page: page,
    });

    console.timeEnd("meili - search");

    const notes: NotesComments[] = hits.map(hit => ({
      id: hit.id,
      name: hit.name,
      type: hit.type,
      date: new Date(hit.date),
      handle: hit.handle,
      body: hit.body,
      bodyJson: hit.body_json,
      noteIsRestacked: hit.note_is_restacked,
      photoUrl: hit.photo_url,
      commentId: hit.comment_id,
      authorId: hit.user_id,
      reactionCount: hit.reaction_count,
      reactions: hit.reaction_count ? JSON.stringify(hit.reaction_count) : null,
      commentsCount: hit.children_count,
      restacks: hit.restacks,
      restacked: hit.restacked,
      timestamp: hit.timestamp,
      contextType: hit.context_type,
      entityKey: hit.entity_key,
    }));

    // Filter out notes we already showed
    const final = notes.filter(note => !existingNotesIds.includes(note.id));
    return final.slice(0, limit); // trim back to requested limit
  } catch (error) {
    console.error("Error searching in Meili", error);
    return [];
  }
}
