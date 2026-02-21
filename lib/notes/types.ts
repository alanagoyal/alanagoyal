export interface Note {
    id: string;
    slug: string;
    title: string;
    content: string;
    created_at: string;
    display_created_at?: string;
    session_id: string | null;
    emoji?: string;
    public: boolean;
    category?: string;
  }
