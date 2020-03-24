export const className = (classes: string[]): string =>
  classes.filter((c) => c !== "").join(" ")
