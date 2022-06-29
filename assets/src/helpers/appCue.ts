export const displayHelp = (location: { pathname: string }): void => {
  switch (location.pathname) {
    case "/":
      showAppcue("-M2dVpHSaOJ4PddV1K9i")
      break
    case "/shuttle-map":
      showAppcue("-M2i04n1MzdepApShKRj")
      break
    case "/settings":
      showAppcue("-M3lWY6d4P9iQqah5Qjz")
      break
    case "/search":
      showAppcue("-M2iXlrreUJAdmvj29GV")
      break
    default:
      // Show nothing, we shouldn't get here
      break
  }
}

const showAppcue = (appcueId: string): void => {
  if (window.Appcues) {
    window.Appcues.show(appcueId)
  }
}
