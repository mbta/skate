defmodule Concentrate.Consumer.VehiclePositions do
  @moduledoc """
  Consumes output from Merge and reports vehicle positions to the realtime server.
  """

  use GenStage

  alias Concentrate.{Merge, VehiclePosition}
  alias Realtime.{Vehicles, Server, Vehicle}

  def start_link(opts) do
    # set fullsweep to periodically garbabe collect the fetched schedule data
    # without having to hibernate after every event. 20 isn't a magic number:
    # the Erlang documentation
    # [https://erlang.org/doc/man/erlang.html#spawn_opt-4] says that processes
    # which mostly have short-lived data can set this to a "suitable value" such
    # as 10 or 20, and 20 appears to address the garbage being kept in memory.
    GenStage.start_link(__MODULE__, opts, spawn_opt: [fullsweep_after: 20])
  end

  @impl GenStage
  def init(opts) do
    {:consumer, :the_state_does_not_matter, opts}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl GenStage
  def handle_info({reference, _}, state) when is_reference(reference),
    do: {:noreply, [], state}

  @impl GenStage
  def handle_events(events, _from, state) do
    groups = List.last(events)

    all_vehicles =
      groups
      |> vehicle_positions_from_groups()
      |> Enum.map(&Vehicle.from_vehicle_position/1)

    timepoint_names_by_id = Schedule.timepoint_names_by_id()

    by_route = Vehicles.group_by_route(all_vehicles, timepoint_names_by_id)
    shuttles = Enum.filter(all_vehicles, & &1.is_shuttle)
    logged_out_vehicles = Enum.reject(all_vehicles, &is_nil(&1.run_id))

    _ = Server.update_vehicles({by_route, shuttles, logged_out_vehicles})

    {:noreply, [], state}
  end

  @spec vehicle_positions_from_groups([Merge.trip_group()]) :: [VehiclePosition.t()]
  defp vehicle_positions_from_groups(groups) do
    Enum.flat_map(groups, fn {_trip_update, vehicle_positions, _stop_time_updates} ->
      vehicle_positions
    end)
  end
end
