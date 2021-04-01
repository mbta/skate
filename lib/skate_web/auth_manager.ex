defmodule SkateWeb.AuthManager do
  use Guardian, otp_app: :skate

  @type access_level :: :none | :general | :admin

  @skate_admin_group "skate-admin"

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

  @spec claims_access_level(Guardian.Token.claims()) :: access_level()
  def claims_access_level(%{"groups" => groups}) do
    if not is_nil(groups) and @skate_admin_group in groups do
      :admin
    else
      :general
    end
  end

  def claims_access_level(_claims) do
    :general
  end
end
