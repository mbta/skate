defmodule Realtime.DataStatus do
  @moduledoc false

  alias Realtime.Vehicle
  require Logger

  @type t :: :good | :outage

  @spec data_status([Vehicle.t()]) :: t()
  def data_status(vehicles) do
    now_fn = Application.get_env(:skate, :now_fn, &Util.Time.now/0)
    now = now_fn.()
    total_count = Enum.count(vehicles)
    vehicles_to_consider = Enum.filter(vehicles, &should_consider?/1)

    {good_count, bad_count} =
      count_partition(vehicles_to_consider, fn vehicle ->
        vehicle_is_good_busloc(vehicle, now) and vehicle_is_good_swiftly(vehicle, now)
      end)

    considered_count = good_count + bad_count

    good_busloc_count =
      vehicles_to_consider |> Enum.filter(&vehicle_is_good_busloc(&1, now)) |> Enum.count()

    good_swiftly_count =
      vehicles_to_consider |> Enum.filter(&vehicle_is_good_swiftly(&1, now)) |> Enum.count()

    Logger.info(
      "data_status_calculation total_vehicles=#{total_count} considered_vehicles=#{considered_count} good_vehicles=#{good_count} good_busloc_vehicles=#{good_busloc_count} good_swiftly_vehicles=#{good_swiftly_count} bad_vehicles=#{bad_count}"
    )

    if considered_count >= 20 and bad_count / considered_count >= 0.20 do
      :outage
    else
      :good
    end
  end

  # Our data often has lots of out of service buses that have
  # good reasons for going stale.
  # Only consider buses that we expect and need to have good data
  @spec should_consider?(Vehicle.t()) :: boolean()
  defp should_consider?(vehicle) do
    vehicle.route_id != nil
  end

  @spec vehicle_is_good_busloc(Vehicle.t(), Util.Time.timestamp()) :: boolean()
  defp vehicle_is_good_busloc(vehicle, now) do
    if Map.get(vehicle.timestamp_by_source, "busloc") == nil do
      false
    else
      age_seconds = now - vehicle.timestamp_by_source["busloc"]
      # 2 and a half minutes ago.
      age_seconds < 150
    end
  end

  @spec vehicle_is_good_swiftly(Vehicle.t(), Util.Time.timestamp()) :: boolean()
  defp vehicle_is_good_swiftly(vehicle, now) do
    if Map.get(vehicle.timestamp_by_source, "swiftly") == nil do
      false
    else
      age_seconds = now - vehicle.timestamp_by_source["swiftly"]
      # 2 and a half minutes ago.
      age_seconds < 150
    end
  end

  @spec count_partition([element], (element -> boolean())) ::
          {non_neg_integer(), non_neg_integer()}
        when element: term()
  defp count_partition(list, predicate) do
    Enum.reduce(list, {0, 0}, fn element, {prev_trues, prev_falses} ->
      if predicate.(element) do
        {prev_trues + 1, prev_falses}
      else
        {prev_trues, prev_falses + 1}
      end
    end)
  end
end
