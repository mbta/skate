defmodule Realtime.DataStatus do
  alias Realtime.Vehicle

  @type t :: :good | :outage

  @spec data_status([Vehicle.t()]) :: t()
  def data_status(vehicles) do
    now_fn = Application.get_env(:skate, :now_fn, &Util.Time.now/0)
    now = now_fn.()

    {good_count, bad_count} =
      vehicles
      |> Enum.filter(&should_consider?/1)
      |> count_partition(fn vehicle -> vehicle_is_good(vehicle, now) end)

    total_count = good_count + bad_count

    if bad_count >= 2 and bad_count / total_count > 0.20 do
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

  @spec vehicle_is_good(Vehicle.t(), Util.Time.timestamp()) :: boolean()
  defp vehicle_is_good(vehicle, now) do
    age_seconds = now - vehicle.timestamp
    # 2 and a half minutes ago.
    age_seconds < 150
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
