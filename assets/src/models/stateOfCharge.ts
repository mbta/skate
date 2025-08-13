export interface StateOfCharge {
  time: Date
  value: number
  milesRemaining: number
}

export const calculateMilesRemaining = ({ value }: { value: number }): number =>
  value * 2
}
