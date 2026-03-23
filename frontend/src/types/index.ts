export type Note = {
  id: number
  user_id: string
  raw_text: string
  title: string
  category: string
  summary: string
  key_points: string[]
  action_items: string[]
  tags: string[]
  emoji: string
  created_at: string
  updated_at: string
}

export type Category = {
  id: number
  name: string
  emoji: string
  color: string
  count: number
}

export type Stats = {
  total: number
  today: number
  top_category: string | null
}
