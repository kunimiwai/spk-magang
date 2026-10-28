import api from './api'

export type CriterionType = 'benefit' | 'cost'

export type Criterion = {
  id: number
  name: string
  description: string | null
  type: CriterionType
  weight: number
  scores_count: number
  created_at: string
  updated_at: string
}

export type CriterionInput = {
  name: string
  description: string | null
  type: CriterionType
  weight: number
}

export type PartnerOption = {
  id: number
  name: string
}

export type PartnerCriterionScore = {
  criterion_id: number
  name: string
  type: CriterionType
  weight: number
  score: number | null
}

export type PartnerScoreSheet = {
  partner: PartnerOption
  criteria: PartnerCriterionScore[]
}

export type PartnerScoreInput = {
  criterion_id: number
  score: number | null
}

type CriterionListResponse = {
  success: boolean
  message: string
  data: Criterion[]
}

type CriterionResponse = {
  success: boolean
  message: string
  data: Criterion
}

type PartnerOptionListResponse = {
  success: boolean
  message: string
  data: PartnerOption[]
}

type PartnerScoreSheetResponse = {
  success: boolean
  message: string
  data: PartnerScoreSheet
}

export async function listCriteria(): Promise<Criterion[]> {
  const response = await api.get<CriterionListResponse>('/admin/criteria')

  return response.data.data
}

export async function createCriterion(
  input: CriterionInput,
): Promise<Criterion> {
  const response = await api.post<CriterionResponse>('/admin/criteria', input)

  return response.data.data
}

export async function updateCriterion(
  id: number,
  input: CriterionInput,
): Promise<Criterion> {
  const response = await api.put<CriterionResponse>(
    `/admin/criteria/${id}`,
    input,
  )

  return response.data.data
}

export async function deleteCriterion(id: number): Promise<void> {
  await api.delete(`/admin/criteria/${id}`)
}

export async function listPartnerOptions(): Promise<PartnerOption[]> {
  const response = await api.get<PartnerOptionListResponse>(
    '/admin/partner-options',
  )

  return response.data.data
}

export async function getPartnerScores(
  partnerId: number,
): Promise<PartnerScoreSheet> {
  const response = await api.get<PartnerScoreSheetResponse>(
    `/admin/partners/${partnerId}/scores`,
  )

  return response.data.data
}

export async function savePartnerScores(
  partnerId: number,
  scores: PartnerScoreInput[],
): Promise<PartnerScoreSheet> {
  const response = await api.put<PartnerScoreSheetResponse>(
    `/admin/partners/${partnerId}/scores`,
    { scores },
  )

  return response.data.data
}
