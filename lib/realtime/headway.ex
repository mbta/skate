defmodule Realtime.Headway do
  alias Schedule.Gtfs.{Direction, Route, Stop}
  alias Realtime.TimePeriod

  defmodule Parser do
    alias Realtime.Headway

    @spec parse_json_data(map()) :: Headway.key_route_headways()
    def parse_json_data(json_data) do
      Map.new(json_data, fn {route_id, direction_origin_headways} ->
        {route_id, parse_direction_origin_headways(direction_origin_headways)}
      end)
    end

    @spec parse_direction_origin_headways(map()) :: Headway.direction_origin_headways()
    def parse_direction_origin_headways(direction_origin_headways) do
      Map.new(direction_origin_headways, fn {direction_id, origin_headways} ->
        {String.to_integer(direction_id), parse_origin_headways(origin_headways)}
      end)
    end

    @spec parse_origin_headways(map()) :: Headway.origin_headways()
    def parse_origin_headways(origin_headways) do
      Map.new(origin_headways, fn {stop_id, time_period_headways} ->
        {stop_id, parse_time_period_headways(time_period_headways)}
      end)
    end

    @spec parse_time_period_headways([map()]) :: [Headway.time_period_headway()]
    def parse_time_period_headways(time_period_headways) do
      Enum.map(time_period_headways, fn %{
                                          "time_period_name" => time_period_name,
                                          "average_headway" => average_headway
                                        } ->
        %{
          time_period_name: time_period_name,
          average_headway: average_headway
        }
      end)
    end
  end

  @type headway_spacing ::
          :very_bunched
          | :bunched
          | :ok
          | :gapped
          | :very_gapped

  @type key_route_headways :: %{Route.id() => direction_origin_headways()}

  @type direction_origin_headways :: %{Direction.id() => origin_headways()}

  @type origin_headways :: %{Stop.id() => [time_period_headway()]}

  @type time_period_headway :: %{
          time_period_name: String.t(),
          average_headway: String.t() | nil
        }

  @type seconds :: non_neg_integer()

  @key_route_headways [File.cwd!(), "data", "key_route_headways.json"]
                      |> Path.join()
                      |> File.read!()
                      |> Jason.decode!()
                      |> Parser.parse_json_data()

  @spec current_headway_spacing(seconds(), seconds()) :: headway_spacing()
  def current_headway_spacing(expected_headway_seconds, headway_seconds) do
    cond do
      headway_seconds / expected_headway_seconds >= 2 -> :very_gapped
      headway_seconds / expected_headway_seconds >= 1.5 -> :gapped
      headway_seconds / expected_headway_seconds <= 0.33 -> :very_bunched
      headway_seconds / expected_headway_seconds <= 0.5 -> :bunched
      true -> :ok
    end
  end

  @spec current_expected_headway_seconds(Route.id(), Direction.id(), Stop.id(), DateTime.t()) ::
          seconds() | nil
  def current_expected_headway_seconds(route_id, direction_id, origin_stop_id, date_time) do
    with {:ok, direction_origin_headways} <- Map.fetch(@key_route_headways, route_id),
         {:ok, origin_headways} <- Map.fetch(direction_origin_headways, direction_id),
         {:ok, headways} <- Map.fetch(origin_headways, origin_stop_id),
         {:ok, time_period} <- TimePeriod.current(date_time),
         {:ok, time_period_headway} <- headway_for_time_period(headways, time_period) do
      time_in_seconds(time_period_headway.average_headway)
    else
      :error -> nil
    end
  end

  @spec time_in_seconds(String.t() | nil) :: seconds() | nil
  def time_in_seconds(nil), do: nil

  def time_in_seconds(time_string) do
    time_string_regex =
      ~r/^(?<hours_string>\d\d):(?<minutes_string>\d\d):(?<seconds_string>\d\d)$/

    %{
      "hours_string" => hours_string,
      "minutes_string" => minutes_string,
      "seconds_string" => seconds_string
    } = Regex.named_captures(time_string_regex, time_string)

    hours = String.to_integer(hours_string)
    minutes = String.to_integer(minutes_string)
    seconds = String.to_integer(seconds_string)

    hours * 60 * 60 + minutes * 60 + seconds
  end

  @spec headway_for_time_period([time_period_headway()], TimePeriod.t()) ::
          {:ok, time_period_headway} | :error
  def headway_for_time_period(headways, time_period) do
    case Enum.find(headways, fn time_period_headway ->
           time_period_headway.time_period_name == time_period.time_period_name
         end) do
      nil -> :error
      time_period_headway -> {:ok, time_period_headway}
    end
  end
end
