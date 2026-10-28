import api from './api'

export type RecommendationStatus = 'ready' | 'not_ready'
export type RecommendationCheckStatus = 'ok' | 'blocked'
export type RecommendationCheckCategory =
  | 'decision'
  | 'analysis'
  | 'data'
  | 'technical'

export type RecommendationCheck = {
  key: string
  label: string
  category: RecommendationCheckCategory
  status: RecommendationCheckStatus
  message: string
}

export type RecommendationCriterion = {
  id: number
  name: string
  type: 'benefit' | 'cost'
  weight: number
}

export type RecommendationRankingEntry = {
  rank: number
  partner_id: number
  partner_name: string
  score: number
  cluster_index: number | null
}

export type RecommendationKMeansSummary = {
  cluster_count: number
  random_seed: number
  feature_criterion_ids: number[]
  iterations: number
  converged: boolean
  partner_count: number
}

export type RecommendationResult = {
  status: RecommendationStatus
  message: string
  checks: RecommendationCheck[]
  criteria: RecommendationCriterion[]
  ranking: RecommendationRankingEntry[]
  kmeans: RecommendationKMeansSummary | null
  explanation: string | null
  disclaimer: string | null
}

type RecommendationResponse = {
  success: boolean
  message: string
  data: RecommendationResult
}

const statuses: RecommendationStatus[] = ['ready', 'not_ready']

export async function getRecommendation(): Promise<RecommendationResult> {
  const response =
    await api.get<RecommendationResponse>('/mahasiswa/recommendations')
  const data = response.data.data

  if (!data || !statuses.includes(data.status)) {
    throw new Error('Respons rekomendasi tidak valid.')
  }

  return data
}
