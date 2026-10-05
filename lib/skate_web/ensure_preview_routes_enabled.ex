defmodule SkateWeb.EnsurePreviewRoutesEnabled do
  @moduledoc false

  use SkateWeb, :plug

  def init(options), do: options

  def call(conn, _opts) do
    if Application.get_env(:skate, :preview_routes_enabled?, false) do
      conn
    else
      conn
      |> put_status(:not_found)
      |> Phoenix.Controller.put_format("html")
      |> Phoenix.Controller.put_view(html: SkateWeb.ErrorHTML)
      |> Phoenix.Controller.render(:"404")
      |> halt()
    end
  end
end
