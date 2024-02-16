defmodule SkateWeb.AuthManager do
  @moduledoc false

  use Guardian, otp_app: :skate
  alias Skate.Settings.User
  require Logger

  @type access_level :: :none | :general | :admin

  @skate_admin_group "skate-admin"
  @skate_dispatcher_group "skate-dispatcher"
  @v2_resource_prefix "v2:"
  @v3_resource_prefix "v3:"

  def v2_resource_prefix, do: @v2_resource_prefix

  def v3_resource_prefix, do: @v3_resource_prefix

  def subject_for_token(%{id: user_id}, _claims) do
    keycloak_enabled? =
      "keycloak-sso" in Enum.map(Skate.Settings.TestGroup.get_override_enabled(), & &1.name)

    if keycloak_enabled? do
      {:ok, "#{@v3_resource_prefix}#{user_id}"}
    else
      {:ok, "#{@v2_resource_prefix}#{user_id}"}
    end
  end

  def resource_from_claims(%{"sub" => @v2_resource_prefix <> user_id}) do
    {:ok, %{id: String.to_integer(user_id)}}
  end

  def resource_from_claims(%{"sub" => @v3_resource_prefix <> user_id}) do
    {:ok, %{id: String.to_integer(user_id)}}
  end

  def resource_from_claims(_), do: {:error, :invalid_claims}

  def verify_claims(%{"sub" => subject} = claims, _options) do
    auth_provider =
      if "keycloak-sso" in Enum.map(Skate.Settings.TestGroup.get_override_enabled(), & &1.name) do
        :keycloak
      else
        :cognito
      end

    case {auth_provider, subject} do
      {:keycloak, @v3_resource_prefix <> _user_id} -> {:ok, claims}
      {:cognito, @v2_resource_prefix <> _user_id} -> {:ok, claims}
      _ -> {:error, :invalid_claims}
    end
  end

  def(username_from_socket!(socket)) do
    socket
    |> Guardian.Phoenix.Socket.current_resource()
    |> username_from_resource()
  end

  def username_from_resource(%{id: user_id}) do
    User.get_by_id!(user_id).username
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
