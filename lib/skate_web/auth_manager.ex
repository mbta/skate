defmodule SkateWeb.AuthManager do
  use Guardian, otp_app: :skate

  @type access_level :: :none | :general | :admin

  @skate_admin_group "skate-admin"
  @skate_dispatcher_group "skate-dispatcher"

  def subject_for_token(resource, _claims) do
    {:ok, resource}
  end

  def resource_from_claims(%{"sub" => %{"username" => username, "user_id" => user_id}}) do
    {:ok, %{username: username, user_id: user_id}}
  end

  def resource_from_claims(_), do: {:error, :invalid_claims}

  def username_from_socket!(socket) do
    {:ok, %{username: username}} =
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

  @spec claims_grant_dispatcher_access?(Guardian.Token.claims()) :: boolean()
  def claims_grant_dispatcher_access?(%{"groups" => groups}) do
    not is_nil(groups) and @skate_dispatcher_group in groups
  end

  def claims_grant_dispatcher_access?(_claims) do
    false
  end
end
