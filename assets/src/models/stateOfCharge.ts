export interface StateOfCharge {
  time: Date | null
  value: number | null
  milesRemaining: number | null
}

export const calculateMilesRemaining = ({
  value,
}: {
  value: number | null
}): number | null => {
  if (value) {
    return value * 2
  } else {
    return null
  }
}
