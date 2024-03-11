import { expect } from "@jest/globals"

// Placeholder while Stop Icon is inaccessible via Accessibility API's
export const stopIcon = {
  get: (container: HTMLElement) => {
    const maybeStop = container.querySelector(".c-stop-icon")
    expect(maybeStop).not.toBeNull()
    return maybeStop as Element
  },

  getAll: (container: HTMLElement) =>
    container.querySelectorAll(".c-stop-icon"),
}

export const missedStopIcon = {
  getAll: (container: HTMLElement) =>
    container.querySelectorAll(".c-missed-stop-icon"),
}
