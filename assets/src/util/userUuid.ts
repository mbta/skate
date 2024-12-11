export const userUuid = (): string | null | undefined =>
  document.querySelector("meta[name=user-uuid]")?.getAttribute("content")
