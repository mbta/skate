defmodule Concentrate.GroupFilter.Shuttle do
  @moduledoc """
  Handle shuttles by skipping StopTimeUpdates involving the shuttle.
  """
  @behaviour Concentrate.GroupFilter
  alias Concentrate.{StopTimeUpdate, TripUpdate}

  @impl Concentrate.GroupFilter
  def filter(trip_group, shuttle_module \\ Concentrate.Filter.Alert.Shuttles)

  def filter({%TripUpdate{} = tu, vps, stus}, module) do
    trip_id = TripUpdate.trip_id(tu)
    route_id = TripUpdate.route_id(tu)
    direction_id = TripUpdate.direction_id(tu)
    date = TripUpdate.start_date(tu)

    stus =
      if is_tuple(date) and is_binary(route_id) and
           module.trip_shuttling?(trip_id, route_id, direction_id, date) do
        shuttle_updates(route_id, stus, module)
      else
        stus
      end

    {tu, vps, stus}
  end

  def filter(other, _module), do: other

  defp shuttle_updates(route_id, stus, module) do
    {stus, _} =
      Enum.flat_map_reduce(stus, {false, false}, &shuttle_stop(route_id, module, &1, &2))

    stus
  end

  defp shuttle_stop(route_id, shuttle_module, stop_time_updates, state)

  defp shuttle_stop(_route_id, _module, stu, {true, true} = state) do
    {[StopTimeUpdate.skip(stu)], state}
  end

  defp shuttle_stop(route_id, module, stu, {has_started?, has_shuttled?}) do
    time = StopTimeUpdate.time(stu)
    stop_id = StopTimeUpdate.stop_id(stu)

    if is_integer(time) do
      case module.stop_shuttling_on_route(route_id, stop_id, time) do
        nil ->
          drop_arrival_time_if_not_started(stu, has_started?, has_shuttled?)

        :through ->
          {[StopTimeUpdate.skip(stu)], {has_started?, has_shuttled? || has_started?}}

        :start ->
          {[StopTimeUpdate.update_departure_time(stu, nil)],
           {has_started?, has_shuttled? || has_started?}}

        :stop ->
          {[StopTimeUpdate.update_arrival_time(stu, nil)], {true, has_shuttled?}}
      end
    else
      drop_arrival_time_if_not_started(stu, has_started?, has_shuttled?)
    end
  end

  defp drop_arrival_time_if_not_started(stu, false, has_shuttled?) do
    {[StopTimeUpdate.update_arrival_time(stu, nil)], {true, has_shuttled?}}
  end

  defp drop_arrival_time_if_not_started(stu, true, has_shuttled?) do
    {[stu], {true, has_shuttled?}}
  end
end
