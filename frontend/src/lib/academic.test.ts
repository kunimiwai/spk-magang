import assert from 'node:assert/strict'
import test from 'node:test'
import {
  courseFormToInput,
  courseToFormValues,
  emptyCourseForm,
  gradeInputFromValues,
  gradeValuesFromSheet,
  normalizeStudentGradeSheet,
  validateCourseForm,
  validateGradeValues,
} from './academic.ts'

test('normalisasi nilai mempertahankan nilai kosong sebagai null', () => {
  const sheet = normalizeStudentGradeSheet({
    courses: [
      {
        id: 1,
        name: 'Algoritma',
        description: 'Mata kuliah uji.',
        score: 0,
        grade_updated_at: null,
      },
      {
        id: 2,
        name: 'Basis Data',
        description: null,
        score: null,
        grade_updated_at: null,
      },
      {
        id: 3,
        name: 'Tanpa Nilai Valid',
        score: '80',
      },
      {
        id: 1,
        name: 'Duplikat',
        score: 90,
      },
    ],
    prerequisite_evaluation: {
      status: 'not_configured',
      message: 'Aturan prasyarat belum dikonfigurasi.',
    },
    score_bounds: { min: -10, max: 100 },
  })

  assert.equal(sheet.courses.length, 3)
  assert.equal(sheet.courses[0].score, 0)
  assert.equal(sheet.courses[1].score, null)
  assert.equal(sheet.courses[2].score, null)
  assert.equal(sheet.prerequisiteEvaluation.status, 'not_configured')
  assert.deepEqual(sheet.scoreBounds, { min: -10, max: 100 })
})

test('normalisasi memakai status dan batas aman bila respons rusak', () => {
  const sheet = normalizeStudentGradeSheet(null)

  assert.deepEqual(sheet.courses, [])
  assert.equal(sheet.prerequisiteEvaluation.status, 'not_configured')
  assert.equal(
    sheet.prerequisiteEvaluation.message,
    'Status aturan prasyarat tidak tersedia dari server.',
  )
  assert.deepEqual(sheet.scoreBounds, {
    min: -999999.999999,
    max: 999999.999999,
  })
})

test('nilai kosong dikirim null dan nilai nol tetap nol', () => {
  const courses = [
    {
      id: 1,
      name: 'Algoritma',
      description: null,
      score: null,
      gradeUpdatedAt: null,
    },
    {
      id: 2,
      name: 'Basis Data',
      description: null,
      score: 0,
      gradeUpdatedAt: null,
    },
  ]

  assert.deepEqual(gradeValuesFromSheet(courses), {
    1: '',
    2: '0',
  })

  assert.deepEqual(
    gradeInputFromValues(courses, { 1: '  ', 2: '0' }),
    [
      { course_id: 1, score: null },
      { course_id: 2, score: 0 },
    ],
  )
})

test('validasi nilai menolak angka tidak valid dan batas penyimpanan', () => {
  const errors = validateGradeValues(
    {
      1: 'bukan-angka',
      2: '101',
      3: '',
      4: '80',
    },
    { min: 0, max: 100 },
  )

  assert.deepEqual(errors, {
    1: 'Nilai harus berupa angka.',
    2: 'Nilai melebihi batas penyimpanan.',
  })
})

test('form mata kuliah mewajibkan nama dan memangkas teks', () => {
  assert.equal(
    validateCourseForm(emptyCourseForm).name,
    'Nama mata kuliah wajib diisi.',
  )

  assert.deepEqual(
    courseFormToInput({
      name: '  Algoritma  ',
      description: '  ',
    }),
    {
      name: 'Algoritma',
      description: null,
    },
  )
})

test('data mata kuliah diubah kembali ke bentuk form', () => {
  const course = {
    id: 1,
    name: 'Algoritma',
    description: 'Mata kuliah uji.',
    grades_count: 0,
    created_at: '2026-10-21T00:00:00.000000Z',
    updated_at: '2026-10-21T00:00:00.000000Z',
  }

  assert.deepEqual(courseToFormValues(course), {
    name: 'Algoritma',
    description: 'Mata kuliah uji.',
  })
})
