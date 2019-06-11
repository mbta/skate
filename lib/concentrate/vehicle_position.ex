defmodule Concentrate.VehiclePosition do
  @moduledoc """
  Structure for representing a transit vehicle's position.
  """
  import Concentrate.StructHelpers

  alias Concentrate.{DataDiscrepancy, VehiclePosition}

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
    :operator_name,
    :run_id,
    :last_updated,
    :stop_name,
    :operator,
    :direction_id,
    :headsign,
    :headway_secs,
    :previous_vehicle_id,
    :previous_vehicle_schedule_adherence_secs,
    :previous_vehicle_schedule_adherence_string,
    :route_id,
    :schedule_adherence_secs,
    :schedule_adherence_string,
    :scheduled_headway_secs,
    :source,
    :data_discrepancies,
    status: :IN_TRANSIT_TO
  ])

  def new(opts) do
    # required fields
    _ = Keyword.fetch!(opts, :latitude)
    _ = Keyword.fetch!(opts, :longitude)
    super(opts)
  end

  defimpl Concentrate.Mergeable do
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
              VehiclePosition.source(second),
              second.trip_id,
              VehiclePosition.source(first),
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
          block_id: first_value(second.block_id, first.block_id),
          operator_id: first_value(second.operator_id, first.operator_id),
          operator_name: first_value(second.operator_name, first.operator_name),
          run_id: first_value(second.run_id, first.run_id),
          stop_name: first_value(second.stop_name, first.stop_name),
          operator: first_value(second.operator, first.operator),
          direction_id: first_value(second.direction_id, first.direction_id),
          headsign: first_value(second.headsign, first.headsign),
          headway_secs: first_value(second.headway_secs, first.headway_secs),
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
              VehiclePosition.source(second),
              second.route_id,
              VehiclePosition.source(first),
              first.route_id
            ),
          schedule_adherence_secs:
            first_value(second.schedule_adherence_secs, first.schedule_adherence_secs),
          schedule_adherence_string:
            first_value(second.schedule_adherence_string, first.schedule_adherence_string),
          scheduled_headway_secs:
            first_value(second.scheduled_headway_secs, first.scheduled_headway_secs),
          source: merge_sources(first, second),
          data_discrepancies: discrepancies(first, second)
      }
    end

    defp first_value(value, _) when not is_nil(value), do: value
    defp first_value(_, value), do: value

    defp swiftly_priority("swiftly", nil, _, value), do: value

    defp swiftly_priority("swiftly", value, _, _), do: value

    defp swiftly_priority(other_source, other_value, "swiftly", value),
      do: swiftly_priority("swiftly", value, other_source, other_value)

    defp swiftly_priority(_, first_value, _, second_value),
      do: first_value(first_value, second_value)

    defp merge_sources(first, second) do
      [VehiclePosition.source(first), VehiclePosition.source(second)]
      |> Enum.sort()
      |> Enum.join("|")
    end

    defp discrepancies(first, second) do
      attributes = [
        {:trip_id, &VehiclePosition.trip_id/1},
        {:route_id, &VehiclePosition.route_id/1}
      ]

      for {key, accessor_fn} <- attributes,
          {first_val, second_val} <- do_discrepancies(accessor_fn, first, second) do
        %DataDiscrepancy{
          attribute: key,
          sources: [
            %{
              id: VehiclePosition.source(first),
              value: first_val
            },
            %{
              id: VehiclePosition.source(second),
              value: second_val
            }
          ]
        }
      end
    end

    defp do_discrepancies(accessor_fn, first, second) do
      first_val = accessor_fn.(first)
      second_val = accessor_fn.(second)

      if first_val != second_val do
        [{first_val, second_val}]
      else
        []
      end
    end
  end
end
