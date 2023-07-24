// Placeholder while Stop Icon is inaccessible via Accessibility API's
export const stopIcon = {
  get: (container: HTMLElement) => {
    const maybeStop = container.querySelector(".c-stop-icon")
    expect(maybeStop).not.toBeNull()
    return maybeStop as Element
  },
}
