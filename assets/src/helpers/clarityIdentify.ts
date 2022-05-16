const clarityIdentify = (
  clarity?: (action: "identify", username: string) => void,
  username?: string | null
) => {
  if (clarity && username) {
    clarity("identify", username)
  }
}

export default clarityIdentify
