export function localizeSpeed(speed) {
  return {
    steady: 'Stabil',
    fast: 'Cepat',
    ultra: 'Sangat cepat',
  }[speed] || speed
}

export function localizeStatus(status) {
  return {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
  }[status] || status
}
