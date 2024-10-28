import { Decorator } from "@storybook/react"

// Currently `layout="fullscreen"` actually means "has zero padding" (https://github.com/storybookjs/storybook/issues/2264#issuecomment-1349251290)
// To force the story to stretch to the available size of the screen we add

// https://github.com/storybookjs/storybook/issues/2264#issuecomment-1218566887
// https://github.com/mozilla/blurts-server/commit/2228d153036c2e4a49d9b00d6e85b4a6b8c3ffc2#diff-e201de4e2ea4ee79f492c0495d7f3fce6389034fe26bfb8f3c877f8c03edf914L22-R24
export const stretchParameterDecorator: Decorator = (StoryFn, cx) => {
  cx.canvasElement.classList.toggle(
    "sb-skate-fill-preview-canvas",
    cx.parameters.stretch === true
  )

  return StoryFn()
}
