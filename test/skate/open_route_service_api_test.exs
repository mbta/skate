defmodule Skate.OpenRouteServiceAPITest do
  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  use ExUnit.Case, async: false

  import Mox

  setup do
    expect(
      Skate.OpenRouteServiceAPI.MockClient,
      :get_directions,
      fn
        %DirectionsRequest{
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
                   "coordinates" => [
                     [0, 0],
                     [0.1, 0.5],
                     [0, 1]
                   ]
                 }
               }
             ]
           }}

        %DirectionsRequest{
          coordinates: [[10, 0], [10, 1]]
        } ->
          {:error, %{"message" => "Invalid API Key"}}
      end
    )

    :ok
  end

  doctest Skate.OpenRouteServiceAPI
end
