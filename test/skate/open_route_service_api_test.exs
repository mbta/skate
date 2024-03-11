defmodule Skate.OpenRouteServiceAPITest do
  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  use ExUnit.Case, async: false

  import Mox

  setup do
    stub(
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
                 },
                 "properties" => %{
                   "segments" => [
                     %{
                       "steps" => [
                         %{
                           "instruction" => "Turn right onto 1st Avenue",
                           "name" => "1st Avenue",
                           "type" => 1
                         }
                       ]
                     },
                     %{
                       "steps" => [
                         %{
                           "instruction" => "Turn left onto 2nd Place",
                           "name" => "2nd Place",
                           "type" => 0
                         },
                         %{
                           "instruction" => "Arrive",
                           "name" => "-",
                           "type" => 10
                         }
                       ]
                     }
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
