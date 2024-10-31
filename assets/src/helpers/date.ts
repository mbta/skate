export const todayIsHalloween = (today: Date = new Date()): boolean =>
  today.getMonth() === 9 && today.getDate() === 31
