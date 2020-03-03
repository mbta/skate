export const now = (): Date => new Date()

export const dateFromEpochSeconds = (time: number): Date =>
  new Date(time * 1_000)

export const formattedTime = (date: Date): string => {
  const hours24 = date.getHours()
  return `${hours12(hours24)}:${zeroPad(date.getMinutes())}${ampm(hours24)}`
}

export const formattedTimeDiff = (a: Date, b: Date): string => {
  const diffMs: number = a.valueOf() - b.valueOf()
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffMinutes = Math.floor((diffMs % 3_600_000) / 60_000)

  const diffMinutesStr = `${diffMinutes}m`

  return diffHours >= 1 ? `${diffHours}h ${diffMinutesStr}` : diffMinutesStr
}

export const hours12 = (hours24: number): number => {
  if (hours24 === 0) {
    return 12
  }
  if (hours24 > 12) {
    return hours24 - 12
  }
  return hours24
}

export const ampm = (hours24: number): string =>
  hours24 >= 12 && hours24 < 24 ? "pm" : "am"

const zeroPad = (time: number): string => (time < 10 ? `0${time}` : `${time}`)
