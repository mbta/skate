export const fullStoryIdentify = (username: string | null | undefined) => {
  if (window.FS && username) {
    window.FS.identify(username, { displayName: username })
  }
}
