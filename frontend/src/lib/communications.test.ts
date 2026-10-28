import assert from 'node:assert/strict'
import test from 'node:test'
import {
  communicationInputFromForm,
  normalizeCommunicationList,
  sortCommunicationsNewestFirst,
  validateCommunicationForm,
} from './communications.ts'

test('riwayat komunikasi hanya memuat data yang valid dan unik', () => {
  const communications = normalizeCommunicationList([
    {
      id: 2,
      direction: 'inbound',
      channel: 'surat',
      occurred_at: '2026-10-23T10:00:00.000000Z',
      summary: 'Balasan mitra diterima.',
      recorder: {
        id: 9,
        name: 'Admin Uji',
        email: 'admin@example.test',
        role: 'admin',
      },
    },
    {
      id: 2,
      direction: 'outbound',
      channel: 'email',
      occurred_at: '2026-10-22T08:00:00.000000Z',
      summary: 'Duplikat.',
    },
    {
      id: 3,
      direction: 'whatsapp',
      channel: 'email',
      occurred_at: '2026-10-22T08:00:00.000000Z',
      summary: 'Kanal tidak didukung.',
    },
  ])

  assert.equal(communications.length, 1)
  assert.equal(communications[0].direction, 'inbound')
  assert.equal(communications[0].recorder?.name, 'Admin Uji')
})

test('riwayat komunikasi diurutkan dari waktu terbaru dengan id sebagai tie-break', () => {
  const communications = normalizeCommunicationList([
    {
      id: 4,
      direction: 'outbound',
      channel: 'email',
      occurred_at: '2026-10-21T08:00:00.000000Z',
      summary: 'Lebih lama.',
    },
    {
      id: 2,
      direction: 'inbound',
      channel: 'surat',
      occurred_at: '2026-10-22T08:00:00.000000Z',
      summary: 'Waktu sama, id lebih kecil.',
    },
    {
      id: 3,
      direction: 'outbound',
      channel: 'email',
      occurred_at: '2026-10-22T08:00:00.000000Z',
      summary: 'Waktu sama, id lebih besar.',
    },
  ])

  assert.deepEqual(
    communications.map((communication) => communication.id),
    [3, 2, 4],
  )

  const sorted = sortCommunicationsNewestFirst([
    communications[2],
    communications[0],
    communications[1],
  ])

  assert.deepEqual(
    sorted.map((communication) => communication.id),
    [3, 2, 4],
  )
})

test('form komunikasi mewajibkan arah, kanal, waktu, dan ringkasan', () => {
  const errors = validateCommunicationForm({
    direction: '',
    channel: '',
    occurredAt: '',
    summary: '',
  })

  assert.equal(errors.direction, 'Pilih arah komunikasi.')
  assert.equal(errors.channel, 'Pilih kanal komunikasi.')
  assert.equal(errors.occurredAt, 'Waktu komunikasi wajib diisi dengan format yang valid.')
  assert.equal(errors.summary, 'Ringkasan komunikasi wajib diisi.')
})

test('form komunikasi mengirim waktu ISO dan ringkasan yang dipangkas', () => {
  const input = communicationInputFromForm({
    direction: 'outbound',
    channel: 'email',
    occurredAt: '2026-10-22T09:30',
    summary: '  Berkas dikirim ke mitra.  ',
  })

  assert.equal(input.direction, 'outbound')
  assert.equal(input.channel, 'email')
  assert.equal(input.summary, 'Berkas dikirim ke mitra.')
  assert.ok(input.occurredAt.endsWith('Z'))
})
