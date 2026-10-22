import assert from 'node:assert/strict'
import test from 'node:test'
import {
  criterionFormToInput,
  criterionToFormValues,
  emptyCriterionForm,
  validateCriterionForm,
  type CriterionFormValues,
} from './criterionForm.ts'
import type { Criterion } from '../services/criteria.ts'

test('nama kriteria wajib diisi', () => {
  const errors = validateCriterionForm(emptyCriterionForm)

  assert.equal(errors.name, 'Nama kriteria wajib diisi.')
})

test('tipe kriteria hanya menerima benefit atau cost', () => {
  const values: CriterionFormValues = {
    ...emptyCriterionForm,
    name: 'Kriteria Uji',
    type: 'lainnya' as CriterionFormValues['type'],
    weight: '1',
  }

  const errors = validateCriterionForm(values)

  assert.equal(errors.type, 'Tipe kriteria harus benefit atau cost.')
})

test('bobot harus berupa angka dan tidak negatif', () => {
  assert.equal(
    validateCriterionForm({
      ...emptyCriterionForm,
      name: 'Kriteria Uji',
      weight: 'bukan-angka',
    }).weight,
    'Bobot kriteria harus berupa angka.',
  )

  assert.equal(
    validateCriterionForm({
      ...emptyCriterionForm,
      name: 'Kriteria Uji',
      weight: '-1',
    }).weight,
    'Bobot kriteria tidak boleh negatif.',
  )
})

test('payload kriteria memangkas teks dan mengubah deskripsi kosong menjadi null', () => {
  const input = criterionFormToInput({
    name: '  Kriteria Uji  ',
    description: '  ',
    type: 'benefit',
    weight: ' 2.5 ',
  })

  assert.deepEqual(input, {
    name: 'Kriteria Uji',
    description: null,
    type: 'benefit',
    weight: 2.5,
  })
})

test('nilai kriteria diubah kembali ke bentuk form', () => {
  const criterion: Criterion = {
    id: 1,
    name: 'Kriteria Uji',
    description: null,
    type: 'cost',
    weight: 3.5,
    scores_count: 0,
    created_at: '2026-10-21T00:00:00.000000Z',
    updated_at: '2026-10-21T00:00:00.000000Z',
  }

  assert.deepEqual(criterionToFormValues(criterion), {
    name: 'Kriteria Uji',
    description: '',
    type: 'cost',
    weight: '3.5',
  })
})
