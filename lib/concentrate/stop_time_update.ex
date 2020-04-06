defmodule Concentrate.StopTimeUpdate do
  @moduledoc """
  Structure for representing an update to a StopTime (e.g. a predicted arrival or departure)
  """
  import Concentrate.StructHelpers
  alias Static.Gtfs.Stop

  defstruct_accessors([
    :trip_id,
    :stop_id,
    :arrival_time,
    :departure_time,
    :stop_sequence,
    :status,
    :track,
    :platform_id,
    :uncertainty,
    :remark,
    schedule_relationship: :SCHEDULED
  ])

  @doc """
  Returns a time for the StopTimeUpdate: arrival if present, otherwise departure.
  """
  @spec time(%__MODULE__{}) :: non_neg_integer | nil
  def time(%__MODULE__{arrival_time: time}) when is_integer(time), do: time
  def time(%__MODULE__{departure_time: time}), do: time

  @compile inline: [time: 1]

  @doc """
  Marks the update as skipped (when the stop is closed, for example).
  """
  @spec skip(%__MODULE__{}) :: t
  def skip(%__MODULE__{} = stu) do
    %{stu | schedule_relationship: :SKIPPED, arrival_time: nil, departure_time: nil}
  end

  defimpl Concentrate.Mergeable do
    @default_key_opts [stop_fn: &Static.stop/1]
    def key(%{trip_id: trip_id, stop_id: stop_id, stop_sequence: stop_sequence}, opts \\ []) do
      opts = Keyword.merge(@default_key_opts, opts)
      stop_fn = opts[:stop_fn]

      parent_station_id =
        if stop_id do
          stop_id
          |> stop_fn.()
          |> Stop.parent_station_id()
        end

      {trip_id, parent_station_id, stop_sequence}
    end

    def merge(first, second) do
      %{
        first
        | arrival_time: time(:lt, first.arrival_time, second.arrival_time),
          departure_time: time(:gt, first.departure_time, second.departure_time),
          status: first.status || second.status,
          track: first.track || second.track,
          schedule_relationship:
            if first.schedule_relationship == :SCHEDULED do
              second.schedule_relationship
            else
              first.schedule_relationship
            end,
          stop_id: max(first.stop_id, second.stop_id),
          platform_id: first.platform_id || second.platform_id,
          uncertainty: first.uncertainty || second.uncertainty,
          remark: first.remark || second.remark
      }
    end

    defp time(_, nil, time), do: time
    defp time(_, time, nil), do: time
    defp time(_, time, time), do: time
    defp time(:lt, first, second) when first < second, do: first
    defp time(:gt, first, second) when first > second, do: first
    defp time(_, _, second), do: second
  end
end
