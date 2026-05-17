export const categoryOptions = [
  'Cafe / Coffee Shop',
  'Coworking Space',
  'Library',
  'Campus Lounge',
  'Restaurant',
  'Rest Area',
]

export const accessTypeOptions = [
  'Customer login',
  'Free after front desk check-in',
  'Public WiFi',
  'Free with purchase',
  'Paid day pass',
  'Open network',
  'Student account',
]

export const passwordSourceOptions = [
  'Verified by staff',
  'Printed on receipt',
  'Displayed on venue signage',
  'Shared by venue owner',
]

export const quickFilters = [
  { label: 'WiFi tercepat', description: '50 Mbps ke atas', query: { speed: 'fast' } },
  { label: 'Nyaman buat kerja', description: 'Area tenang + colokan', query: { outlets: 'true' } },
  { label: 'Buka 24 jam', description: 'Cocok buat kerja malam', query: { open24: 'true' } },
  { label: 'Dekat kampus', description: 'Sekitar Rajabasa dan Kedaton', query: { q: 'Rajabasa' } },
]

export const legalRules = [
  'Hanya WiFi publik atau akses yang disetujui pemilik tempat yang boleh ditampilkan.',
  'Password hanya boleh muncul jika terpampang di lokasi atau dibagikan langsung oleh staf/pemilik.',
  'Setiap password wajib punya sumber yang jelas sebelum disetujui admin.',
]

export const defaultSubmissionForm = {
  name: '',
  category: categoryOptions[0],
  address: '',
  district: '',
  latitude: '',
  longitude: '',
  wifiAvailable: true,
  wifiAccessType: accessTypeOptions[0],
  wifiPassword: '',
  passwordSource: '',
  accessNotes: '',
  wifiSpeedMbps: '',
  uploadMbps: '',
  pingMs: '',
  hasPowerOutlets: true,
  open24Hours: false,
  quietZone: true,
  ambienceLabel: 'Prioritas tinggi',
  mapContext: '',
  operatingHours: '',
  imageTone: 'lagoon',
  imageUrl: '',
  submitterName: '',
  submitterEmail: '',
}

export const categoryLabels = {
  'Cafe / Coffee Shop': 'Kafe / Kedai Kopi',
  'Coworking Space': 'Ruang Kerja Bersama',
  Library: 'Perpustakaan',
  'Campus Lounge': 'Area Kampus',
  Restaurant: 'Restoran',
  'Rest Area': 'Area Istirahat',
}

export const accessTypeLabels = {
  'Customer login': 'Login pelanggan',
  'Free after front desk check-in': 'Gratis setelah check-in',
  'Public WiFi': 'WiFi publik',
  'Free with purchase': 'Gratis dengan pembelian',
  'Paid day pass': 'Tiket harian berbayar',
  'Open network': 'Jaringan terbuka',
  'Student account': 'Akun mahasiswa',
}

export const passwordSourceLabels = {
  'Verified by staff': 'Diverifikasi staf',
  'Printed on receipt': 'Tercetak di struk',
  'Displayed on venue signage': 'Tertera di lokasi',
  'Shared by venue owner': 'Dibagikan pemilik tempat',
}

export const ambienceLabels = {
  'High Priority': 'Prioritas tinggi',
  'Stable Ping': 'Ping stabil',
  'Quiet Zone': 'Area tenang',
  'Work Hub': 'Pusat kerja',
  'Ultra Fast': 'Sangat cepat',
  'Traveler Pick': 'Pilihan singgah',
  'New Submission': 'Kiriman baru',
}

export function localizeLabel(value) {
  return categoryLabels[value] || accessTypeLabels[value] || passwordSourceLabels[value] || ambienceLabels[value] || value
}
