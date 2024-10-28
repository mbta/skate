defmodule Skate.OpenRouteServiceAPITest do
  alias Skate.OpenRouteServiceAPI.DirectionsResponse
  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  use ExUnit.Case, async: false

  import Mox

  import Skate.Factory

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

  test "Ignores :goal, :depart, and :straight" do
    expect(
      Skate.OpenRouteServiceAPI.MockClient,
      :get_directions,
      fn _ ->
        {:ok,
         build(:ors_directions_json,
           segments: [
             %{
               "steps" => [
                 %{
                   "instruction" => "not-in-results",
                   # Depart
                   "type" => 11
                 },
                 %{
                   "instruction" => "1",
                   "type" => 1
                 },
                 %{
                   "instruction" => "not-in-results",
                   # Goal
                   "type" => 10
                 }
               ]
             },
             %{
               "steps" => [
                 %{
                   "instruction" => "not-in-results",
                   # Depart
                   "type" => 11
                 },
                 %{
                   "instruction" => "not-in-results",
                   # Straight
                   "type" => 6
                 },
                 %{
                   "instruction" => "2",
                   "type" => 0
                 }
               ]
             }
           ]
         )}
      end
    )

    assert {:ok,
            %DirectionsResponse{
              directions: [
                %{instruction: "1"},
                %{instruction: "2"}
              ]
            }} =
             Skate.OpenRouteServiceAPI.directions([
               %{"lat" => 0, "lon" => 0},
               %{"lat" => 0, "lon" => 1}
             ])
  end

  test "unknown errors from ORS return `type: :unknown`" do
    expect(
      Skate.OpenRouteServiceAPI.MockClient,
      :get_directions,
      fn _ ->
        {:error, %{"code" => -1}}
      end
    )

    assert {:error, %{type: :unknown}} =
             Skate.OpenRouteServiceAPI.directions([
               %{"lat" => 0, "lon" => 0},
               %{"lat" => 0, "lon" => 1}
             ])
  end

  test "point not found errors from ORS return `type: :no_route`" do
    expect(
      Skate.OpenRouteServiceAPI.MockClient,
      :get_directions,
      fn _ ->
        {:error, %{"code" => 2010}}
      end
    )

    assert {:error, %{type: :no_route}} =
             Skate.OpenRouteServiceAPI.directions([
               %{"lat" => 0, "lon" => 0},
               %{"lat" => 0, "lon" => 1}
             ])
  end
end
