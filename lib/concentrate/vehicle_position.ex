defmodule Concentrate.VehiclePosition do
  @moduledoc """
  Structure for representing a transit vehicle's position.
  """
  import Concentrate.StructHelpers

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
    :is_nonrevenue,
    :layover_departure_time,
    :previous_vehicle_id,
    :previous_vehicle_schedule_adherence_secs,
    :previous_vehicle_schedule_adherence_string,
    :route_id,
    :schedule_adherence_secs,
    :schedule_adherence_string,
    :scheduled_headway_secs,
    current_status: :IN_TRANSIT_TO
  ])

  def new(opts) do
    # required fields
    _ = Keyword.fetch!(opts, :latitude)
    _ = Keyword.fetch!(opts, :longitude)
    super(opts)
  end
end
