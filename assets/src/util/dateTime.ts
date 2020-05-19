export const now = (): Date => new Date()

export const dateFromEpochSeconds = (time: number): Date =>
  new Date(time * 1_000)

export const formattedTime = (date: Date): string => {
  const hours24 = date.getHours()
  return `${hours12(hours24)}:${zeroPad(date.getMinutes())}${ampm(hours24)}`
}

export const formattedDuration = (duration: number): string => {
  const diffHours = Math.floor(duration / 3_600)
  const diffMinutes = Math.floor((duration % 3_600) / 60)

  const diffMinutesStr = `${diffMinutes}m`

  return diffHours >= 1 ? `${diffHours}h ${diffMinutesStr}` : diffMinutesStr
}

export const formattedTimeDiff = (a: Date, b: Date): string =>
  formattedDuration(a.valueOf() / 1000 - b.valueOf() / 1000)

/** Takes a time of day in seconds since midnight
 */
export const formattedScheduledTime = (time: number): string => {
  const minutes = Math.floor(time / 60)
  const hours25 = Math.floor(minutes / 60)
  const minutes60 = minutes - hours25 * 60
  return `${hours12(hours25)}:${zeroPad(minutes60)}${ampm(hours25)}`
}

export const hours12 = (hours25: number): number => hours25 % 12 || 12

export const ampm = (hours24: number): string =>
  hours24 >= 12 && hours24 < 24 ? "pm" : "am"

const zeroPad = (time: number): string => (time < 10 ? `0${time}` : `${time}`)
