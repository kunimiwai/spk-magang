import api from './api'

export type Partner = {
  id: number
  name: string
  address: string | null
  contact: string | null
  email: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export type PartnerInput = {
  name: string
  address: string | null
  contact: string | null
  email: string | null
  description: string | null
}

export type PaginationMeta = {
  current_page: number
  per_page: number
  last_page: number
  total: number
}

type PartnerListResponse = {
  success: boolean
  message: string
  data: Partner[]
  meta: PaginationMeta
}

type PartnerResponse = {
  success: boolean
  message?: string
  data: Partner
}

type DeletePartnerResponse = {
  success: boolean
  message: string
}

export async function listPartners(params: {
  page: number
  perPage: number
}): Promise<{ partners: Partner[]; meta: PaginationMeta }> {
  const response = await api.get<PartnerListResponse>('/admin/partners', {
    params: {
      page: params.page,
      per_page: params.perPage,
    },
  })

  return {
    partners: response.data.data,
    meta: response.data.meta,
  }
}

export async function createPartner(input: PartnerInput): Promise<Partner> {
  const response = await api.post<PartnerResponse>('/admin/partners', input)

  return response.data.data
}

export async function updatePartner(
  id: number,
  input: PartnerInput,
): Promise<Partner> {
  const response = await api.put<PartnerResponse>(
    `/admin/partners/${id}`,
    input,
  )

  return response.data.data
}

export async function deletePartner(id: number): Promise<void> {
  await api.delete<DeletePartnerResponse>(`/admin/partners/${id}`)
}
