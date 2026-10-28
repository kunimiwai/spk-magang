import api from './api'
import type { RecommendationCheck } from './recommendations'

export type AnalyticsCriterionStats = {
  id: number
  name: string
  type: 'benefit' | 'cost'
  weight: number
  stats: {
    count: number
    min: number
    max: number
    average: number
  } | null
  missing_partner_count: number
}

export type AnalyticsFeatureAverage = {
  criterion_id: number
  criterion_name: string
  average: number | null
}

export type AnalyticsCluster = {
  cluster_index: number
  partner_count: number
  feature_averages: AnalyticsFeatureAverage[]
}

export type AnalyticsKMeans = {
  configured: boolean
  message: string
  iterations: number | null
  converged: boolean | null
  distribution: AnalyticsCluster[] | null
  service_error: string | null
}

export type AnalyticsData = {
  partners: { count: number }
  criteria: AnalyticsCriterionStats[]
  scores: { filled_pairs: number; total_pairs: number }
  kmeans: AnalyticsKMeans
  recommendation: {
    status: 'ready' | 'not_ready'
    checks: RecommendationCheck[]
  }
  notes: string[]
}

type AnalyticsResponse = {
  success: boolean
  message: string
  data: AnalyticsData
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const response = await api.get<AnalyticsResponse>('/admin/analytics')
  const data = response.data.data

  if (
    !data ||
    !data.partners ||
    !Array.isArray(data.criteria) ||
    !data.scores ||
    !data.kmeans ||
    !data.recommendation
  ) {
    throw new Error('Respons analitik tidak valid.')
  }

  return data
}
