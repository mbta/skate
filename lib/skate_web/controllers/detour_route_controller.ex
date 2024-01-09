defmodule SkateWeb.DetourRouteController do
  @moduledoc """
  Detour API
  """
  use SkateWeb, :controller

  def directions(conn, %{"coordinates" => coordinates}) when is_list(coordinates) do
    case Skate.OpenRouteServiceAPI.directions(coordinates) do
      {:ok, result} ->
        render(conn, :result, data: result)

      {:error, error} ->
        Sentry.capture_message("OpenRouteServiceAPI error", extra: %{error: error})

        conn
        |> put_status(:internal_server_error)
        |> render(:error, error: error)
    end
  end
end
