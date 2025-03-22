export interface CreatePostResponse {
  user_id: number;
  body: string;
  body_json: any;
  post_id: number | null;
  publication_id: number | null;
  ancestor_path: string;
  type: "feed";
  status: "published" | string;
  reply_minimum_role: string | null;
  id: number;
  deleted: boolean;
  date: string; // ISO format
  name: string;
  photo_url: string | null;
  reactions: Record<string, number>;
  children: any[]; // could be further typed if needed
  user_bestseller_tier: string | null;
  isFirstFeedCommentByUser: boolean;
  reaction_count: number;
  restacks: number;
  restacked: boolean;
  children_count: number;
  attachments: any[];
  user_primary_publication: UserPrimaryPublication;
}

interface Paragraph {
  type: "paragraph";
  content: TextContent[];
}

type TextContent =
  | {
      type: "text";
      text: string;
      marks?: Mark[];
    }
  | Paragraph; // recursive for nested paragraphs (yes, it’s messy like that)

interface Mark {
  type: "bold" | "code" | string;
}

interface UserPrimaryPublication {
  id: number;
  subdomain: string;
  custom_domain_optional: boolean;
  name: string;
  author_id: number;
  user_id: number;
  handles_enabled: boolean;
  explicit: boolean;
  is_personal_mode: boolean;
}
