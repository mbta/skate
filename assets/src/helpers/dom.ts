type RemovedTypes = null | undefined | false
export const joinTruthy = (strings: (string | RemovedTypes)[], joiner = " ") =>
  strings.filter(Boolean).join(joiner)

export const joinClasses = (classes: (string | RemovedTypes)[]): string =>
  joinTruthy(classes, " ")
