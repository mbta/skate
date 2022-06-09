export const tagManagerEvent = (event: string): void => {
  if (window.dataLayer) {
    window.dataLayer.push({ event: event })
  }
}
