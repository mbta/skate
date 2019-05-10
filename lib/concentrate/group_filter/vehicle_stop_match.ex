defmodule Concentrate.GroupFilter.VehicleStopMatch do
  @moduledoc """
  Updates a VehiclePosition's `stop_id` to match the StopTimeUpdate.

  When using the `stop_id` of the StopTimeUpdate to assign the trip to a
  track, it may become out of sync with the stop ID the vehicle is at. This
  filter updates the stop_id for the VehiclePosition to be the same as that
  of the StopTimeUpdate with the same stop sequence (if they share a parent).
  """
  @behaviour Concentrate.GroupFilter
  alias Concentrate.Filter.GTFS.Stops
  alias Concentrate.{StopTimeUpdate, VehiclePosition}

  @impl Concentrate.GroupFilter
  def filter({tu, vps, stus}) do
    vps =
      for vp <- vps do
        match_stop_id(vp, stus)
      end

    {tu, vps, stus}
  end

  defp match_stop_id(vp, stus) do
    vp_stop_sequence = VehiclePosition.stop_sequence(vp)
    update = Enum.find(stus, &(StopTimeUpdate.stop_sequence(&1) == vp_stop_sequence))

    match_stop_id_to_update(vp, update)
  end

  defp match_stop_id_to_update(vp, %StopTimeUpdate{} = stu) do
    vp_stop_id = VehiclePosition.stop_id(vp)
    stu_stop_id = StopTimeUpdate.stop_id(stu)

    if is_binary(vp_stop_id) and is_binary(stu_stop_id) and vp_stop_id != stu_stop_id and
         Stops.parent_station_id(vp_stop_id) == Stops.parent_station_id(stu_stop_id) do
      VehiclePosition.update_stop_id(vp, stu_stop_id)
    else
      vp
    end
  end

  defp match_stop_id_to_update(vp, nil) do
    vp
  end
end
