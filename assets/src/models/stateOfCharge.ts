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
  return value && value * 2
}
