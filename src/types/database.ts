export type Role = 'admin' | 'player'
export type LinkType = 'hudl' | 'file'
export type Visibility = 'team' | 'individual'
export type SessionType = 'game' | 'practice'

export interface Profile {
  id: string
  role: Role
  name: string
  avatar_url: string | null
  jersey_number: number | null
  position: 'Guard' | 'Forward' | 'Center' | null
  class_year: 'Fr' | 'So' | 'Jr' | 'Sr' | null
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

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface StatUpload {
  id: string
  created_by: string
  label: string
  session_type: SessionType
  session_date: string
  created_at: string
}

export interface StatEntry {
  id: string
  upload_id: string
  player_id: string
  minutes: number | null
  points: number | null
  fg_made: number | null
  fg_attempted: number | null
  three_made: number | null
  three_attempted: number | null
  ft_made: number | null
  ft_attempted: number | null
  off_reb: number | null
  def_reb: number | null
  total_reb: number | null
  assists: number | null
  steals: number | null
  blocks: number | null
  turnovers: number | null
  fouls: number | null
  custom: Record<string, number | string | null>
  created_at: string
}

export interface StatAnnotation {
  id: string
  upload_id: string
  player_id: string
  note: string
  created_by: string
  created_at: string
}

export interface StatGoal {
  id: string
  player_id: string
  stat_key: string
  target: number
  created_by: string
  created_at: string
}

// Enriched stat entry with upload metadata joined
export interface StatEntryWithUpload extends StatEntry {
  upload: Pick<StatUpload, 'session_date' | 'session_type' | 'label'>
}

// Weekly aggregate — computed client-side from StatEntryWithUpload[]
export interface WeeklyStatSummary {
  weekStart: string           // ISO date of Monday
  label: string               // last upload label for that week
  session_type: SessionType
  points: number | null
  total_reb: number | null
  assists: number | null
  steals: number | null
  blocks: number | null
  turnovers: number | null
  minutes: number | null
  fg_made: number | null
  fg_attempted: number | null
  three_made: number | null
  three_attempted: number | null
  ft_made: number | null
  ft_attempted: number | null
  off_reb: number | null
  def_reb: number | null
  fouls: number | null
  custom: Record<string, number | null>
  // Team context (populated separately)
  teamAvg?: Record<string, number | null>
  teamBest?: Record<string, number | null>
  teamTotal?: Record<string, number | null>
}

// ─── Wellness ─────────────────────────────────────────────────────────────────

export type WellnessQuestionType = 'rating' | 'yesno' | 'text'

export interface WellnessQuestion {
  id: string
  type: WellnessQuestionType
  label: string
}

export interface WellnessForm {
  id: string
  title: string
  questions: WellnessQuestion[]
  is_active: boolean
  created_by: string
  created_at: string
}

export interface WellnessResponse {
  id: string
  form_id: string
  player_id: string
  date: string
  answers: Record<string, number | string>
  submitted_at: string
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
      stat_uploads: {
        Row: StatUpload
        Insert: Omit<StatUpload, 'id' | 'created_at'>
        Update: Partial<Omit<StatUpload, 'id' | 'created_at'>>
        Relationships: never[]
      }
      stat_entries: {
        Row: StatEntry
        Insert: Omit<StatEntry, 'id' | 'created_at'>
        Update: Partial<Omit<StatEntry, 'id' | 'created_at'>>
        Relationships: never[]
      }
      stat_annotations: {
        Row: StatAnnotation
        Insert: Omit<StatAnnotation, 'id' | 'created_at'>
        Update: Partial<Omit<StatAnnotation, 'id' | 'created_at'>>
        Relationships: never[]
      }
      stat_goals: {
        Row: StatGoal
        Insert: Omit<StatGoal, 'id' | 'created_at'>
        Update: Partial<Omit<StatGoal, 'id' | 'created_at'>>
        Relationships: never[]
      }
      wellness_forms: {
        Row: WellnessForm
        Insert: Omit<WellnessForm, 'id' | 'created_at'>
        Update: Partial<Omit<WellnessForm, 'id' | 'created_at'>>
        Relationships: never[]
      }
      wellness_responses: {
        Row: WellnessResponse
        Insert: Omit<WellnessResponse, 'id' | 'submitted_at'>
        Update: Partial<Omit<WellnessResponse, 'id' | 'submitted_at'>>
        Relationships: never[]
      }
    }
  }
}
