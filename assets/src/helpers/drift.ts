export const openDrift = (): void => {
  // drift is set by scripts loaded by _drift.html.eex
  // but we don't have types for it
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (drift !== undefined && drift.api !== undefined) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    drift.api.sidebar.toggle()
  }
}
