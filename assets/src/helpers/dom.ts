// ts-lint doesn't like either Array<string | undefined> or
// (string | undefined)[], so we create this type as a workaround.
export type MaybeString = string | undefined

export const className = (classes: MaybeString[]): string =>
  classes.filter((c) => c && c !== "").join(" ")
