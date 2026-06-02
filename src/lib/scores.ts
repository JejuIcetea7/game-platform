import { supabase } from './supabase'

export type GameKey = 'one-line' | 'dance-teacher' | 'lunch-run'

export type ScoreRecord = {
  rank: number
  name: string
  score: string
  date: string
}

type ScoreRow = {
  player_name: string
  score_value: number
  created_at: string
}

const gameConfigs: Record<GameKey, {
  order: 'asc' | 'desc'
  formatScore: (score: number) => string
}> = {
  'one-line': {
    order: 'asc',
    formatScore: (score) => `${(score / 1000).toFixed(2)}초`,
  },
  'dance-teacher': {
    order: 'desc',
    formatScore: (score) => `${score.toLocaleString()}점`,
  },
  'lunch-run': {
    order: 'desc',
    formatScore: (score) => `${score}m`,
  },
}

function formatDate(value: string) {
  const date = new Date(value)
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export async function fetchTopScores(gameKey: GameKey): Promise<ScoreRecord[]> {
  if (!supabase) return []

  const config = gameConfigs[gameKey]
  const { data, error } = await supabase
    .from('game_scores')
    .select('player_name, score_value, created_at')
    .eq('game_key', gameKey)
    .order('score_value', { ascending: config.order === 'asc' })
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) {
    console.error(`Failed to fetch scores for ${gameKey}`, error)
    return []
  }

  return ((data || []) as ScoreRow[]).map((row, index) => ({
    rank: index + 1,
    name: row.player_name,
    score: config.formatScore(row.score_value),
    date: formatDate(row.created_at),
  }))
}

export async function fetchAllTopScores() {
  const entries = await Promise.all(
    (Object.keys(gameConfigs) as GameKey[]).map(async (gameKey) => [
      gameKey,
      await fetchTopScores(gameKey),
    ] as const),
  )

  return Object.fromEntries(entries) as Record<GameKey, ScoreRecord[]>
}

export async function submitScore(gameKey: GameKey, playerName: string, scoreValue: number) {
  if (!supabase) throw new Error('Supabase is not configured')

  const cleanName = playerName.trim().slice(0, 12) || '익명'
  const cleanScore = Math.max(0, Math.floor(scoreValue))

  const { error } = await supabase
    .from('game_scores')
    .insert({
      game_key: gameKey,
      player_name: cleanName,
      score_value: cleanScore,
    })

  if (error) throw error
}
