export const tagManagerEvent = (event: string): void => {
  if (window.dataLayer) {
    window.dataLayer.push({ event: event })
  }
}

export const tagManagerIdentify = (userId?: string | null): void => {
  if (window.dataLayer && userId) {
    window.dataLayer.push({ user_id: userId })
  }
}
