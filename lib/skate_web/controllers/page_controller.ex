defmodule SkateWeb.PageController do
  require Logger
  use SkateWeb, :controller
  alias SkateWeb.AuthManager
  alias Plug.Crypto.{KeyGenerator, MessageEncryptor}

  @key_base :skate
            |> Application.get_env(SkateWeb.Endpoint)
            |> Keyword.fetch!(:secret_key_base)

  @salts :skate
         |> Application.get_env(SkateWeb.Endpoint)
         |> Keyword.fetch!(:signing_salts)

  @secret KeyGenerator.generate(@key_base, @salts.secret)
  @signed_secret KeyGenerator.generate(@key_base, @salts.signed_secret)

  plug(:laboratory_features)

  def index(conn, _params) do
    uid = AuthManager.Plug.current_resource(conn)

    _ = Logger.info("uid=#{uid}")

    conn
    |> assign(:user_info, user_info(uid))
    |> render("index.html")
  end

  defp user_info(id) when is_binary(id) do
    %{
      id: MessageEncryptor.encrypt(id, @secret, @signed_secret),
      username: id
    }
  end

  defp laboratory_features(conn, _) do
    laboratory_features =
      :laboratory
      |> Application.get_env(:features)
      |> Map.new(fn {key, _, _} -> {key, Laboratory.enabled?(conn, key)} end)

    assign(conn, :laboratory_features, laboratory_features)
  end
end
