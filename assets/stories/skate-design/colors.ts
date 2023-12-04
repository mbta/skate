import themeCss from "../../css/exports/colors/theme.module.scss"
import serviceCss from "../../css/exports/colors/service.module.scss"
import mbtaCss from "../../css/exports/colors/mbta.module.scss"
import eggplantCss from "../../css/exports/colors/all-colors.eggplant.module.scss"
import kiwiCss from "../../css/exports/colors/all-colors.kiwi.module.scss"
import strawberryCss from "../../css/exports/colors/all-colors.strawberry.module.scss"
import lemonCss from "../../css/exports/colors/all-colors.lemon.module.scss"
import grayCss from "../../css/exports/colors/all-colors.gray.module.scss"
import systemStateCss from "../../css/exports/colors/system-state.module.scss"

const sanitizeKeys = (
  css: { [key: string]: string },
  colorPrefix = "--color-"
) =>
  Object.entries(css).reduce((prev, current) => {
    if (current[0].startsWith(colorPrefix)) {
      const sanitizedKey = current[0]
        .replace(colorPrefix, "")
        .replace(/-/g, "_")
      prev[sanitizedKey] = current[1]
      prev[sanitizedKey] = current[1]
      delete prev[current[0]]
    }
    return prev
  }, css)

export const themeColors = sanitizeKeys(themeCss)
export const serviceColors = sanitizeKeys(serviceCss)
export const mbtaColors = sanitizeKeys(mbtaCss)
export const allColors = {
  eggplant: sanitizeKeys(eggplantCss, "--color-eggplant-"),
  kiwi: sanitizeKeys(kiwiCss, "--color-kiwi-"),
  strawberry: sanitizeKeys(strawberryCss, "--color-strawberry-"),
  lemon: sanitizeKeys(lemonCss, "--color-lemon-"),
  gray: sanitizeKeys(grayCss, "--color-gray-"),

  systemState: sanitizeKeys(systemStateCss),
}
