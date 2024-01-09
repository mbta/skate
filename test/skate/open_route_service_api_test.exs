defmodule Skate.OpenRouteServiceAPITest do
  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  use ExUnit.Case, async: false

  import Mox

  # setup :verify_on_exit!

  setup do
    DirectionsRequest

    expect(
      Skate.OpenRouteServiceAPI.MockClient,
      :get_directions,
      fn %DirectionsRequest{
           coordinates: [
             [0, 0],
             [1, 0]
           ]
         } ->
        {:ok,
         %{
           "features" => [
             %{
               "geometry" => %{
                 "coordinates" => [[0, 0], [0.1, 0.5], [0, 1]]
               }
             }
           ]
         }}
      end
    )

    :ok
  end

  doctest Skate.OpenRouteServiceAPI
end
