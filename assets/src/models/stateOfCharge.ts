export interface StateOfCharge {
  time: Date
  value: number
  milesRemaining: number
  percent: number
}

export const calculatePercent = ({ value }: { value: number }): number =>
  Math.round(value / 1000)

export const calculateMilesRemaining = ({ value }: { value: number }): number =>
  calculatePercent({ value }) * 2
