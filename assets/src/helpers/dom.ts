export const className = (
  classes: (string | null | undefined | false)[]
): string => classes.filter((c) => c && c !== "").join(" ")
