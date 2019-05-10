defmodule Concentrate.GroupFilter.VehicleAtSkippedStop do
  @moduledoc """
  Updates a VehiclePosition to not have a stop_id at a SKIPPED stop.
  """
  @behaviour Concentrate.GroupFilter
  alias Concentrate.{StopTimeUpdate, VehiclePosition}

  @impl Concentrate.GroupFilter
  def filter({tu, vps, stus}) do
    vps =
      for vp <- vps do
        move_stop_id(vp, stus)
      end

    {tu, vps, stus}
  end

  defp move_stop_id(vp, stus) do
    if stop_id = VehiclePosition.stop_id(vp) do
      case Enum.split_while(stus, &(StopTimeUpdate.stop_id(&1) != stop_id)) do
        {_before_vehicle, [stop | after_vehicle]} ->
          if StopTimeUpdate.schedule_relationship(stop) == :SKIPPED do
            update_vehicle_to_next_non_skipped_update(vp, after_vehicle)
          else
            vp
          end

        _ ->
          vp
      end
    else
      vp
    end
  end

  defp update_vehicle_to_next_non_skipped_update(vp, stus) do
    {stop_sequence, stop_id} =
      if non_skipped = Enum.find(stus, &(StopTimeUpdate.schedule_relationship(&1) != :SKIPPED)) do
        {
          StopTimeUpdate.stop_sequence(non_skipped),
          StopTimeUpdate.stop_id(non_skipped)
        }
      else
        {nil, nil}
      end

    VehiclePosition.update(vp, %{
      status: :IN_TRANSIT_TO,
      stop_sequence: stop_sequence,
      stop_id: stop_id
    })
  end
end
