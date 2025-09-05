export type StateOfCharge = {
  time: Date
  value: number
  milesRemaining: number
}

export type StateOfChargeMissing = {
  time: null
  value: null
  milesRemaining: null
}

export type StateOfChargeUnknown = null

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
