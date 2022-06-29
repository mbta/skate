export const locationForPath = (
  path: string
): { pathname: string; search: string; state: string | null; hash: string } => {
  return {
    pathname: path,
    search: "",
    state: null,
    hash: "",
  }
}
