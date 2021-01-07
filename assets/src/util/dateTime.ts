export const now = (): Date => new Date()

export const dateFromEpochSeconds = (time: number): Date =>
  new Date(time * 1_000)

export const formattedTime = (date: Date): string => {
  return formattedHoursMinutes(date.getHours(), date.getMinutes())
}

export const formattedDuration = (duration: number): string => {
  const diffHours = Math.floor(duration / 3_600)
  const diffMinutes = Math.floor((duration % 3_600) / 60)

  const diffMinutesStr = `${diffMinutes} min`

  return diffHours >= 1 ? `${diffHours} hr ${diffMinutesStr}` : diffMinutesStr
}

export const formattedTimeDiff = (a: Date, b: Date): string =>
  formattedDuration(a.valueOf() / 1000 - b.valueOf() / 1000)

/** Returns the difference if it's less than or equal to the threshold.
    Returns b (formatted) if the difference is greater than the threshold.
*/
export const formattedTimeDiffUnderThreshold = (
  a: Date,
  b: Date,
  thresholdMinutes60: number
): string => {
  const diffSeconds = a.valueOf() / 1000 - b.valueOf() / 1000
  return diffSeconds <= thresholdMinutes60 * 60
    ? formattedDuration(diffSeconds)
    : formattedTime(b)
}

/** Takes a time of day in seconds since midnight
 */
export const formattedScheduledTime = (time: number): string => {
  const minutes = Math.floor(time / 60)
  const hours25 = Math.floor(minutes / 60)
  const minutes60 = minutes - hours25 * 60
  return formattedHoursMinutes(hours25, minutes60)
}

export const formattedHoursMinutes = (
  hours25: number,
  minutes60: number
): string => {
  const hours12 = hours25 % 12 || 12
  const zeroPaddedMinutes = minutes60 < 10 ? `0${minutes60}` : `${minutes60}`
  const ampm = hours25 >= 12 && hours25 < 24 ? "PM" : "AM"
  return `${hours12}:${zeroPaddedMinutes} ${ampm}`
}
