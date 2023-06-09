defmodule Concentrate.VehiclePosition do
  @moduledoc """
  Structure for representing a transit vehicle's position.
  """
  import Concentrate.StructHelpers

  alias Concentrate.DataDiscrepancy
  alias Schedule.Block

  defstruct_accessors([
    :id,
    :trip_id,
    :stop_id,
    :label,
    :license_plate,
    :latitude,
    :longitude,
    :bearing,
    :speed,
    :odometer,
    :stop_sequence,
    :block_id,
    :operator_id,
    :operator_first_name,
    :operator_last_name,
    :operator_logon_time,
    :overload_offset,
    :run_id,
    :last_updated,
    :last_updated_by_source,
    :stop_name,
    :operator,
    :direction_id,
    :headsign,
    :layover_departure_time,
    :previous_vehicle_id,
    :previous_vehicle_schedule_adherence_secs,
    :previous_vehicle_schedule_adherence_string,
    :route_id,
    :schedule_adherence_secs,
    :schedule_adherence_string,
    :sources,
    :data_discrepancies,
    :crowding,
    :revenue,
    current_status: :IN_TRANSIT_TO
  ])

  def new(opts) do
    # required fields
    _ = Keyword.fetch!(opts, :latitude)
    _ = Keyword.fetch!(opts, :longitude)
    super(opts)
  end

  def comes_from_swiftly?(%{sources: %MapSet{} = sources}), do: Enum.member?(sources, "swiftly")
  def comes_from_swiftly?(_), do: false

  defimpl Concentrate.Mergeable do
    alias Concentrate.VehiclePosition

    def key(%{id: id}, _opts \\ []), do: id

    @doc """
    Merging VehiclePositions takes the latest position for a given vehicle.
    """
    def merge(first, %{last_updated: nil}) do
      first
    end

    def merge(%{last_updated: nil}, second) do
      second
    end

    def merge(first, second) do
      if first.last_updated <= second.last_updated do
        do_merge(first, second)
      else
        do_merge(second, first)
      end
    end

    defp do_merge(first, second) do
      %{
        second
        | trip_id:
            swiftly_priority(
              second.sources,
              second.trip_id,
              first.sources,
              first.trip_id
            ),
          stop_id: first_value(second.stop_id, first.stop_id),
          label: first_value(second.label, first.label),
          license_plate: first_value(second.license_plate, first.license_plate),
          latitude: first_value(second.latitude, first.latitude),
          longitude: first_value(second.longitude, first.longitude),
          bearing: first_value(second.bearing, first.bearing),
          speed: first_value(second.speed, first.speed),
          odometer: first_value(second.odometer, first.odometer),
          stop_sequence: first_value(second.stop_sequence, first.stop_sequence),
          block_id:
            overload_or_swiftly_priority(
              second.sources,
              second.block_id,
              first.sources,
              first.block_id
            ),
          operator_id: first_value(second.operator_id, first.operator_id),
          operator_first_name: first_value(second.operator_first_name, first.operator_first_name),
          operator_last_name: first_value(second.operator_last_name, first.operator_last_name),
          operator_logon_time: first_value(second.operator_logon_time, first.operator_logon_time),
          overload_offset: first_value(second.overload_offset, first.overload_offset),
          run_id: first_value(second.run_id, first.run_id),
          stop_name: first_value(second.stop_name, first.stop_name),
          operator: first_value(second.operator, first.operator),
          direction_id: first_value(second.direction_id, first.direction_id),
          headsign:
            swiftly_priority(
              second.sources,
              second.headsign,
              first.sources,
              first.headsign
            ),
          previous_vehicle_id: first_value(second.previous_vehicle_id, first.previous_vehicle_id),
          previous_vehicle_schedule_adherence_secs:
            first_value(
              second.previous_vehicle_schedule_adherence_secs,
              first.previous_vehicle_schedule_adherence_secs
            ),
          previous_vehicle_schedule_adherence_string:
            first_value(
              second.previous_vehicle_schedule_adherence_string,
              first.previous_vehicle_schedule_adherence_string
            ),
          route_id:
            swiftly_priority(
              second.sources,
              second.route_id,
              first.sources,
              first.route_id
            ),
          schedule_adherence_secs:
            first_value(second.schedule_adherence_secs, first.schedule_adherence_secs),
          schedule_adherence_string:
            first_value(second.schedule_adherence_string, first.schedule_adherence_string),
          sources: merge_sources(first, second),
          data_discrepancies: discrepancies(first, second),
          layover_departure_time:
            swiftly_priority(
              second.sources,
              second.layover_departure_time,
              first.sources,
              first.layover_departure_time
            ),
          crowding: first_value(first.crowding, second.crowding),
          revenue: first_value(first.revenue, second.revenue),
          last_updated_by_source: merge_last_updated_by_source(first, second)
      }
    end

    defp first_value(value, _) when not is_nil(value), do: value
    defp first_value(_, value), do: value

    defp swiftly_priority(sources1, value1, sources2, value2)

    defp swiftly_priority(_sources1, value1, _sources2, nil), do: value1

    defp swiftly_priority(_sources1, nil, _sources2, value2), do: value2

    defp swiftly_priority(sources1, value1, sources2, value2) do
      cond do
        VehiclePosition.comes_from_swiftly?(%{sources: sources1}) ->
          if VehiclePosition.comes_from_swiftly?(%{sources: sources2}) do
            first_value(value1, value2)
          else
            value1
          end

        VehiclePosition.comes_from_swiftly?(%{sources: sources2}) ->
          value2

        true ->
          first_value(value1, value2)
      end
    end

    defp overload_or_swiftly_priority(_sources1, block_id1, _sources2, nil), do: block_id1

    defp overload_or_swiftly_priority(_sources1, nil, _sources2, block_id2), do: block_id2

    defp overload_or_swiftly_priority(sources1, block_id1, sources2, block_id2) do
      cond do
        Block.overload?(block_id1) ->
          block_id1

        Block.overload?(block_id2) ->
          block_id2

        true ->
          swiftly_priority(sources1, block_id1, sources2, block_id2)
      end
    end

    defp merge_sources(first, second) do
      [first, second]
      |> Enum.flat_map(&(VehiclePosition.sources(&1) || MapSet.new()))
      |> MapSet.new()
    end

    defp merge_last_updated_by_source(first, second) do
      first_map = Map.get(first, :last_updated_by_source) || %{}
      second_map = Map.get(second, :last_updated_by_source) || %{}
      Map.merge(first_map, second_map)
    end

    defp discrepancies(first, second) do
      attributes = [
        {:block_id, &VehiclePosition.block_id/1},
        {:trip_id, &VehiclePosition.trip_id/1}
      ]

      Enum.flat_map(attributes, &discrepancy(&1, first, second))
    end

    defp discrepancy({key, accessor_fn}, first, second) do
      first_val = accessor_fn.(first)
      second_val = accessor_fn.(second)

      if first_val != second_val do
        [
          %DataDiscrepancy{
            attribute: key,
            sources: [
              %{
                id: source_id(first.sources),
                value: first_val
              },
              %{
                id: source_id(second.sources),
                value: second_val
              }
            ]
          }
        ]
      else
        []
      end
    end

    @spec source_id(MapSet.t()) :: String.t()
    defp source_id(sources), do: Enum.join(sources, "|")
  end
end
