defmodule Concentrate.Reporter.VehicleLatency do
  @moduledoc """
  Reporter which logs how recently the latest vehicle was updated.
  """
  @behaviour Concentrate.Reporter
  alias Concentrate.VehiclePosition

  @impl Concentrate.Reporter
  def init do
    []
  end

  @impl Concentrate.Reporter
  def log(groups, state) do
    now = utc_now()

    latenesses =
      groups
      # get the vehicle positions
      |> Enum.flat_map(&elem(&1, 1))
      |> Enum.flat_map(&timestamp(&1, now))

    latest =
      if latenesses == [] do
        :undefined
      else
        Enum.min(latenesses)
      end

    {average, count} = average(latenesses)

    {[latest_vehicle_lateness: latest, average_vehicle_lateness: average, vehicle_count: count],
     state}
  end

  defp timestamp(%VehiclePosition{} = vp, now) do
    case VehiclePosition.last_updated(vp) do
      nil -> []
      timestamp -> [now - timestamp]
    end
  end

  defp timestamp(_, _) do
    []
  end

  def average([]) do
    {:undefined, 0}
  end

  def average(items) do
    {total, count} =
      Enum.reduce(items, {0, 0}, fn v, {total, count} -> {total + v, count + 1} end)

    {total / count, count}
  end

  defp utc_now do
    :os.system_time(:seconds)
  end
end
