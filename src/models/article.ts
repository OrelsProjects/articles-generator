export interface Article {
  canonical_url: string;
  description: string;
  id: string;
  post_date: string;
  slug: string;
  subtitle: string;
  title: string;
  wordcount: number;
  cover_image: string;
  email_from_name: string;
  explicit: boolean;
  hidden: boolean;
  is_guest: boolean;
  podcast_episode_image_info: string;
  postTags: string[];
  publication_id: string;
  reaction: string;
  reaction_count: number;
  reactions: {
    [key: string]: number;
  };
  search_engine_description: string;
  search_engine_title: string;
  social_title: string;
  truncated_body_text: string;
}
