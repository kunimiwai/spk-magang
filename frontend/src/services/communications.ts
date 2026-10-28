import api from './api'
import {
  normalizeCommunication,
  normalizeCommunicationList,
  type ApplicationCommunication,
  type CommunicationChannel,
  type CommunicationDirection,
} from '../lib/communications'

type ApiEnvelope = {
  success: boolean
  message?: string
  data: unknown
}

export type CommunicationInput = {
  direction: CommunicationDirection
  channel: CommunicationChannel
  occurredAt: string
  summary: string
}

function unwrap(response: { data: ApiEnvelope }): unknown {
  if (response.data?.success !== true) {
    throw new Error('Respons server tidak valid.')
  }

  return response.data.data
}

export async function listApplicationCommunications(
  applicationId: number,
): Promise<ApplicationCommunication[]> {
  const response = await api.get<ApiEnvelope>(
    `/admin/applications/${applicationId}/communications`,
  )

  return normalizeCommunicationList(unwrap(response))
}

export async function createApplicationCommunication(
  applicationId: number,
  input: CommunicationInput,
): Promise<ApplicationCommunication> {
  const response = await api.post<ApiEnvelope>(
    `/admin/applications/${applicationId}/communications`,
    {
      direction: input.direction,
      channel: input.channel,
      occurred_at: input.occurredAt,
      summary: input.summary,
    },
  )

  const communication = normalizeCommunication(unwrap(response))

  if (communication === null) {
    throw new Error('Respons komunikasi tidak valid.')
  }

  return communication
}
