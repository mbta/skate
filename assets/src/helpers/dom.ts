export const className = (classes: (string | null | undefined)[]): string =>
  classes.filter((c) => c && c !== "").join(" ")
