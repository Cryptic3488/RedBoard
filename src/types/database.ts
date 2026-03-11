export type Role = 'admin' | 'player'
export type LinkType = 'hudl' | 'file'
export type Visibility = 'team' | 'individual'

export interface Profile {
  id: string
  role: Role
  name: string
  created_at: string
}

export interface FilmPost {
  id: string
  created_by: string
  title: string
  note: string
  link_type: LinkType
  url: string
  visibility: Visibility
  created_at: string
}

export interface FilmPostRecipient {
  post_id: string
  player_id: string
}

export interface FilmPostView {
  post_id: string
  player_id: string
  viewed_at: string
}

// Enriched query result — from .select('*, creator:profiles!created_by(name)')
// creator may be null if RLS blocks the join (e.g. policy gap)
export interface FilmPostWithCreator extends FilmPost {
  creator: Pick<Profile, 'name'> | null
}

export type Database = {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: never[]
      }
      film_posts: {
        Row: FilmPost
        Insert: Omit<FilmPost, 'id' | 'created_at'>
        Update: Partial<Omit<FilmPost, 'id' | 'created_at'>>
        Relationships: never[]
      }
      film_post_recipients: {
        Row: FilmPostRecipient
        Insert: FilmPostRecipient
        Update: Partial<FilmPostRecipient>
        Relationships: never[]
      }
      film_post_views: {
        Row: FilmPostView
        Insert: Omit<FilmPostView, 'viewed_at'>
        Update: Partial<FilmPostView>
        Relationships: never[]
      }
    }
  }
}
