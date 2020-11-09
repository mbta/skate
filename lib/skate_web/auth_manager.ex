defmodule SkateWeb.AuthManager do
  use Guardian, otp_app: :skate

  def subject_for_token(resource, _claims) do
    {:ok, resource}
  end

  def resource_from_claims(%{"sub" => username}) do
    {:ok, username}
  end

  def resource_from_claims(_), do: {:error, :invalid_claims}

  def username_from_socket!(socket) do
    {:ok, username} =
      socket
      |> Guardian.Phoenix.Socket.current_token()
      |> decode_and_verify!()
      |> resource_from_claims()

    username
  end

  defp decode_and_verify!(token) do
    {:ok, decoded} = decode_and_verify(token)
    decoded
  end
end
