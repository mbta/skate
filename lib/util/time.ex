defmodule Util.Time do
  @typedoc """
  Seconds after midnight.
  This is used as a date-agnostic way to talk about time of day.
  It's really seconds after 12 hours before noon, in order to avoid complications with DST.
  Times are measured relative to the date of service,
  so times > 24*60*60 are after midnight relative to the previous date.
  """
  @type time_of_day :: integer()

  @typedoc """
  Unix timestamp, seconds past the epoch
  """
  @type timestamp :: integer()

  @spec now :: timestamp()
  def now do
    System.system_time(:second)
  end

  @doc """
  Times greater than 24:00:00 are allowed.

      iex> Util.Time.parse_hhmmss("05:00:00")
      18000

      iex> Util.Time.parse_hhmmss("22:00:00")
      79200

      # Times past 24:00 are measured from the previous day
      iex> Util.Time.parse_hhmmss("25:00:00")
      90000
  """
  @spec parse_hhmmss(String.t()) :: time_of_day()
  def parse_hhmmss(time_string) do
    [hh_string, mm_string, ss_string] = String.split(time_string, ":")
    h = String.to_integer(hh_string)
    m = String.to_integer(mm_string)
    s = String.to_integer(ss_string)
    h * 60 * 60 + m * 60 + s
  end

  @doc """
  Converts a timestamp to a time_of_day in Eastern Time

  Since time_of_day is not restricted to a 24 hour range,
  it may be ambiguous which time_of_day is best.
  Do you want 03:00 or 27:00?
  Takes a "target" time_of_day and returns a time_of_day closest to it,
  so the result time_of_day is the correct one in context.

    # When the target is slightly earlier than the timestamp
    iex> Util.Time.nearest_time_of_day_for_timestamp(
    ...>   1546362000, # 2019-01-01 12:00:00 EST
    ...>   Util.Time.parse_hhmmss("11:00:00")
    ...> )
    43200 # 12:00:00

    # When the target is slightly later than the timestamp
    iex> Util.Time.nearest_time_of_day_for_timestamp(
    ...>   1546362000, # 2019-01-01 12:00:00 EST
    ...>   Util.Time.parse_hhmmss("13:00:00")
    ...> )
    43200 # 12:00:00

    # When the closest target is on the previous date.
    iex> Util.Time.nearest_time_of_day_for_timestamp(
    ...>   1546408800, # 2019-01-02 01:00:00 EST
    ...>   Util.Time.parse_hhmmss("18:00:00")
    ...> )
    90000 # 25:00:00

    # When the closest target is on the next date.
    iex> Util.Time.nearest_time_of_day_for_timestamp(
    ...>   1546383600, # 2019-01-01 18:00:00 EST
    ...>   Util.Time.parse_hhmmss("01:00:00")
    ...> )
    -21600 # -06:00:00 (6 hours before the date starts)

    # When the closest target is on the next date but same date of service.
    iex> Util.Time.nearest_time_of_day_for_timestamp(
    ...>   1546383600, # 2019-01-01 18:00:00 EST
    ...>   Util.Time.parse_hhmmss("25:00:00")
    ...> )
    64800 # 18:00:00
  """
  @spec nearest_time_of_day_for_timestamp(timestamp(), time_of_day()) :: time_of_day()
  def nearest_time_of_day_for_timestamp(timestamp, target) do
    date_of_timestamp =
      timestamp
      |> DateTime.from_unix!(:second)
      |> Timex.Timezone.convert("America/New_York")
      |> DateTime.to_date()

    on_same_date = time_of_day_for_timestamp(timestamp, date_of_timestamp)
    days_to_move_forward = round((on_same_date - target) / (24 * 60 * 60))
    date_to_use = Timex.shift(date_of_timestamp, days: days_to_move_forward)

    time_of_day_for_timestamp(timestamp, date_to_use)
  end

  @doc """
    iex> Util.Time.time_of_day_for_timestamp(
    ...>   1546408800, # 2019-01-02 01:00:00 EST
    ...>   ~D[2019-01-02]
    ...> )
    3600 # 01:00:00

    iex> Util.Time.time_of_day_for_timestamp(
    ...>   1546408800, # 2019-01-02 01:00:00 EST
    ...>   ~D[2019-01-01]
    ...> )
    90000 # 25:00:00
  """
  @spec time_of_day_for_timestamp(timestamp(), Date.t()) :: time_of_day()
  def time_of_day_for_timestamp(timestamp, date) do
    noon = noon_on_date(date)
    seconds_after_noon = timestamp - noon
    seconds_after_noon + 12 * 60 * 60
  end

  @spec noon_on_date(Date.t()) :: timestamp()
  defp noon_on_date(date) do
    # Convert to datetime on the next date and shift back to ignore daylight saving time jumps.
    date
    |> Timex.shift(days: 1)
    |> Timex.to_datetime("America/New_York")
    |> Timex.shift(hours: -12)
    |> Timex.to_unix()
  end
end
