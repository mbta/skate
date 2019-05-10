defmodule Concentrate.Reporter.StopTimeUpdateLatency do
  @moduledoc """
  Reporter which logs how close the earliest/latest StopTimeUpdates are.
  """
  @behaviour Concentrate.Reporter
  alias Concentrate.StopTimeUpdate

  @impl Concentrate.Reporter
  def init do
    []
  end

  @impl Concentrate.Reporter
  def log(groups, state) do
    {earliest_time, latest_time} =
      groups
      |> Enum.flat_map(&elem(&1, 2))
      |> Enum.reduce({:infinity, 0}, &timestamp/2)

    earliest_time = optional_time(earliest_time, :infinity)
    latest_time = optional_time(latest_time, 0)

    {[earliest_stop_time_update: earliest_time, latest_stop_time_update: latest_time], state}
  end

  defp timestamp(%StopTimeUpdate{} = stu, {earliest, latest}) do
    time = StopTimeUpdate.time(stu)

    earliest =
      case time do
        nil ->
          earliest

        time ->
          min(earliest, time)
      end

    latest =
      case time do
        nil -> latest
        time -> max(latest, time)
      end

    {earliest, latest}
  end

  defp timestamp(_, latest_timestamps) do
    latest_timestamps
  end

  defp optional_time(default, default), do: :undefined
  defp optional_time(time, _), do: time - utc_now()

  defp utc_now do
    :os.system_time(:seconds)
  end
end
