const clarityInit = (
  clarity?: (action: "identify", username: string) => void,
  username?: string
) => {
  if (clarity && username) {
    clarity("identify", username)
  }
}

export default clarityInit
