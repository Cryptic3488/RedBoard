export type Role = 'admin' | 'player'

export interface Profile {
  id: string
  role: Role
  name: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
    }
  }
}
