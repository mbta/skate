type RemovedTypes = null | undefined | false
export const joinTruthy = (strings: (string | RemovedTypes)[], joiner = " ") =>
  strings.filter(Boolean).join(joiner)

export const className = (
  classes: (string | null | undefined | false)[]
): string => joinTruthy(classes, " ")
