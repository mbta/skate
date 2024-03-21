defmodule Skate.OpenRouteServiceAPI do
  @moduledoc """
  The OpenRouteServiceAPI context.
  """

  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  alias Skate.OpenRouteServiceAPI.DirectionsResponse

  @doc """
  Returns a response from OpenRouteService containing coordinates of a route shape.

  The coordinates in both the input and the output for `directions/1` are formatted
  as maps with keys `lat` and `lon`.

  ## Example (with some fake API data)
      iex> Skate.OpenRouteServiceAPI.directions([%{"lat" => 0, "lon" => 0}, %{"lat" => 0, "lon" => 1}])
      {
        :ok,
        %Skate.OpenRouteServiceAPI.DirectionsResponse{
          coordinates: [
            %{"lat" => 0, "lon" => 0},
            %{"lat" => 0.5, "lon" => 0.1},
            %{"lat" => 1, "lon" => 0}
          ],
          directions: [
            %{
              instruction: "Turn right onto 1st Avenue"
            },
            %{
              instruction: "Turn left onto 2nd Place"
            }
          ]
        }
      }

  If no coordinates are given, or only one is, then `directions/1` will bypass the actual
  API call and just return a response with an empty route shape.

  ## Examples
      iex> Skate.OpenRouteServiceAPI.directions([])
      {:ok, %Skate.OpenRouteServiceAPI.DirectionsResponse{coordinates: [], directions: []}}

      iex> Skate.OpenRouteServiceAPI.directions([%{"lat" => 0, "lon" => 0}])
      {:ok, %Skate.OpenRouteServiceAPI.DirectionsResponse{coordinates: [], directions: []}}

  If anything goes wrong, then this returns an error instead.

  ## Examples
      iex> Skate.OpenRouteServiceAPI.directions([%{"lat" => 0, "lon" => 10}, %{"lat" => 1, "lon" => 10}])
      {:error, %{"message" => "Invalid API Key"}}
  """
  @spec directions(list()) :: {:ok, DirectionsResponse.t()} | {:error, any()}
  def directions([]), do: {:ok, %DirectionsResponse{}}
  def directions([_]), do: {:ok, %DirectionsResponse{}}

  def directions(coordinates) when is_list(coordinates) do
    request = %DirectionsRequest{
      coordinates:
        Enum.map(coordinates, fn
          %{"lat" => lat, "lon" => lon} -> [lon, lat]
        end)
    }

    case client().get_directions(request) do
      {:ok, payload} ->
        parse_directions(payload)

      {:error, error} ->
        parse_error(error)
    end
  end

  defp parse_directions(payload) do
    %{
      "features" => [
        %{
          "geometry" => %{"coordinates" => coordinates},
          "properties" => %{"segments" => segments}
        }
      ]
    } = payload

    {:ok,
     %DirectionsResponse{
       coordinates: Enum.map(coordinates, fn [lon, lat] -> %{"lat" => lat, "lon" => lon} end),
       directions:
         segments
         |> Enum.flat_map(& &1["steps"])
         |> Enum.filter(fn %{"type" => type} ->
           map_type(type) not in [:goal, :depart, :straight, :error]
         end)
         |> Enum.map(
           &%{
             instruction: &1["instruction"]
           }
         )
     }}
  end

  # Convert API Error codes into specific errors for the frontend to handle
  # https://giscience.github.io/openrouteservice/api-reference/error-codes

  # 2010: Point was not found.
  defp parse_error(%{"code" => 2010}), do: {:error, %{type: :no_route}}

  defp parse_error(_error), do: {:error, %{type: :unknown}}

  defp client(), do: Application.get_env(:skate, Skate.OpenRouteServiceAPI)[:client]

  defp map_type(type_id) do
    case type_id do
      0 -> :left
      1 -> :right
      2 -> :sharp_left
      3 -> :sharp_right
      4 -> :slight_left
      5 -> :slight_right
      6 -> :straight
      7 -> :enter_roundabout
      8 -> :exit_roundabout
      9 -> :u_turn
      10 -> :goal
      11 -> :depart
      12 -> :keep_left
      13 -> :keep_right
      _ -> :error
    end
  end
end
