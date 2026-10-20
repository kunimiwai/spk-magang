/**
 * Label peran yang sudah dikonfirmasi:
 * - D-001: Admin dan Prodi adalah role terpisah.
 * - D-002: DPM adalah Dosen Pembimbing Magang.
 * - D-003: Mitra tidak memiliki akun aplikasi.
 *
 * Nilai role tetap berupa string karena matriks izin dan mekanisme akun
 * (OD-001–OD-004) belum final. Role yang tidak dikenal ditampilkan apa adanya.
 */
const roleLabels: Record<string, string> = {
  admin: 'Admin',
  prodi: 'Prodi',
  mahasiswa: 'Mahasiswa',
  dpm: 'DPM',
}

export function getRoleLabel(role: string): string {
  return roleLabels[role] ?? role
}
