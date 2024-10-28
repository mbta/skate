defmodule Realtime.TimePeriod do
  @moduledoc false

  @type t :: %__MODULE__{
          time_period_id: String.t(),
          day_type_id: day_type(),
          time_period_sequence: non_neg_integer(),
          time_period_type: String.t(),
          time_period_name: String.t(),
          time_period_start_time: String.t(),
          time_period_end_time: String.t(),
          time_period_start_time_sec: seconds(),
          time_period_end_time_sec: seconds()
        }

  @type day_type :: :day_type_01 | :day_type_02 | :day_type_03

  @type seconds :: non_neg_integer()

  @data [File.cwd!(), "data", "time_periods.json"]
        |> Path.join()
        |> File.read!()
        |> Jason.decode!()
        |> Enum.map(fn %{
                         "time_period_id" => time_period_id,
                         "day_type_id" => day_type_id,
                         "time_period_sequence" => time_period_sequence,
                         "time_period_type" => time_period_type,
                         "time_period_name" => time_period_name,
                         "time_period_start_time" => time_period_start_time,
                         "time_period_end_time" => time_period_end_time,
                         "time_period_start_time_sec" => time_period_start_time_sec,
                         "time_period_end_time_sec" => time_period_end_time_sec
                       } ->
          [
            time_period_id: time_period_id,
            day_type_id: String.to_atom(day_type_id),
            time_period_sequence: time_period_sequence,
            time_period_type: time_period_type,
            time_period_name: time_period_name,
            time_period_start_time: time_period_start_time,
            time_period_end_time: time_period_end_time,
            time_period_start_time_sec: time_period_start_time_sec,
            time_period_end_time_sec: time_period_end_time_sec
          ]
        end)

  defstruct [
    :time_period_id,
    :day_type_id,
    :time_period_sequence,
    :time_period_type,
    :time_period_name,
    :time_period_start_time,
    :time_period_end_time,
    :time_period_start_time_sec,
    :time_period_end_time_sec
  ]

  @spec current() :: {:ok, t()} | :error
  @spec current(DateTime.t()) :: {:ok, t()} | :error
  def current(date_time \\ Timex.now()) do
    case Enum.find(data(), &by_extended_day_time(&1, date_time)) do
      nil -> :error
      %__MODULE__{} = time_period -> {:ok, time_period}
    end
  end

  @spec day_type(DateTime.t()) :: day_type()
  def day_type(date_time) do
    case Date.day_of_week(date_time) do
      7 ->
        :day_type_03

      6 ->
        :day_type_02

      _ ->
        :day_type_01
    end
  end

  @spec extended_day_seconds(DateTime.t()) :: seconds()
  def extended_day_seconds(date_time) do
    seconds_since_midnight = seconds_since_midnight(date_time)

    if before_3_am(date_time) do
      twenty_four_hours_in_seconds = 24 * 60 * 60
      twenty_four_hours_in_seconds + seconds_since_midnight
    else
      seconds_since_midnight
    end
  end

  @spec seconds_since_midnight() :: seconds()
  @spec seconds_since_midnight(DateTime.t()) :: seconds()
  def seconds_since_midnight(date_time \\ Timex.now()) do
    DateTime.diff(date_time, Timex.beginning_of_day(date_time), :second)
  end

  @spec data() :: [t()]
  def data() do
    Enum.map(@data, &struct(__MODULE__, &1))
  end

  @spec by_extended_day_time(t(), DateTime.t()) :: boolean
  defp by_extended_day_time(
         %__MODULE__{
           day_type_id: day_type_id,
           time_period_start_time_sec: time_period_start_time_sec,
           time_period_end_time_sec: time_period_end_time_sec
         },
         date_time
       ) do
    seconds = extended_day_seconds(date_time)

    day_type(date_time) == day_type_id &&
      seconds >= time_period_start_time_sec &&
      seconds < time_period_end_time_sec
  end

  @spec before_3_am(DateTime.t()) :: boolean
  defp before_3_am(%DateTime{hour: hour}), do: hour < 3
end
