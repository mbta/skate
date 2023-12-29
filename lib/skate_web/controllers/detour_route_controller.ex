defmodule SkateWeb.DetourRouteController do
  @moduledoc """
  Detour API
  """
  use SkateWeb, :controller

  def directions(conn, %{"coordinates" => [_]}) do
    render(conn, :result, data: %Skate.OpenRouteServiceAPI.DirectionsResponse{})
  end

  def directions(conn, %{"coordinates" => coordinates}) when is_list(coordinates) do
    case Skate.OpenRouteServiceAPI.directions(coordinates) do
      {:ok, result} ->
        render(conn, :result, data: result)

      {:error, error} ->
        conn
        |> put_status(:bad_request)
        |> render(:error, error: error)
    end
  end
end
