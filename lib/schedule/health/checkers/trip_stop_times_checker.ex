defmodule Schedule.Health.Checkers.TripStopTimesChecker do
  @moduledoc """
  Check that Schedules returns at least a minimum number of stop times for a representative trip of each configured route.
  """
  require Logger

  alias Schedule.Gtfs.{Route, RoutePattern}
  alias Schedule.Trip

  @type config :: [timepoint_config()]
  @type timepoint_config :: %{
          route_id: Route.id(),
          min_length: non_neg_integer()
        }

  @spec healthy?(config) :: boolean
  def healthy?(timepoint_configs) when is_list(timepoint_configs),
    do: Enum.all?(timepoint_configs, &healthy_route?/1)

  @spec healthy_route?(timepoint_config()) :: boolean
  defp healthy_route?(%{route_id: route_id, min_length: min_length}) do
    case trip(route_id) do
      {:trip, %Trip{stop_times: stop_times, id: id}} ->
        length = length(stop_times)
        pass? = length >= min_length

        if !pass? do
          Logger.warning(
            "#{__MODULE__} failed on trip_id=#{id} of route_id=#{route_id}. min_length=#{min_length} length=#{length}"
          )
        end

        pass?

      _ ->
        false
    end
  end

  @spec trip(Route.id()) :: {:trip, Trip.t()} | nil
  defp trip(route_id) do
    route_id
    |> trip_id()
    |> fetch_trip()
  end

  @spec trip_id(Route.id()) :: Trip.id() | nil
  defp trip_id(route_id) do
    route_id
    |> route_pattern()
    |> representative_trip_id()
  end

  @spec route_pattern(Route.id()) :: RoutePattern.t() | nil
  def(route_pattern(route_id)) do
    first_route_pattern_for_route_and_direction_fn =
      Application.get_env(
        :skate_web,
        :first_route_pattern_for_route_and_direction_fn,
        &Schedule.first_route_pattern_for_route_and_direction/2
      )

    first_route_pattern_for_route_and_direction_fn.(route_id, 0)
  end

  @spec representative_trip_id(RoutePattern.t() | nil) :: Trip.id() | nil
  def representative_trip_id(nil), do: nil

  def representative_trip_id(%RoutePattern{representative_trip_id: representative_trip_id}),
    do: representative_trip_id

  @spec fetch_trip(Trip.id() | nil) :: {:trip, Trip.t()} | nil
  def fetch_trip(nil), do: nil

  def fetch_trip(trip_id) do
    trip_fn = Application.get_env(:realtime, :trip_fn, &Schedule.trip/1)

    case trip_fn.(trip_id) do
      nil ->
        nil

      trip ->
        {:trip, trip}
    end
  end
end
