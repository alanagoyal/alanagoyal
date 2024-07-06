export interface Note {
    id: string;
    slug: string;
    title: string;
    content: string;
    created_at: string;
    session_id: string;
    emoji?: string;
    public: boolean;
  }