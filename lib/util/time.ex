defmodule Util.Time do
  @moduledoc false

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

  @spec today() :: Date.t()
  def today() do
    date_of_timestamp(now())
  end

  @spec naive_now() :: NaiveDateTime.t()
  def naive_now do
    NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second)
  end

  @doc """
  Times greater than 24:00:00 are allowed.

      iex> Util.Time.parse_hhmm("05:00")
      18000

      iex> Util.Time.parse_hhmm("22:00")
      79200

      # Times past 24:00 are measured from the previous day
      iex> Util.Time.parse_hhmm("25:00")
      90000
  """
  @spec parse_hhmm(String.t()) :: time_of_day()
  def parse_hhmm(time_string) do
    [hh_string, mm_string] = String.split(time_string, ":")
    h = String.to_integer(hh_string)
    m = String.to_integer(mm_string)
    h * 60 * 60 + m * 60
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
  Takes a "day_start" time_of_day.
  Returns the next time_of_day after that which matches the timestamp.
  It's guaranteed that the result will be >= day_start

    # When the day_start is slightly earlier than the timestamp, the result is close to it
    iex> Util.Time.next_time_of_day_for_timestamp_after(
    ...>   # 2019-01-01 12:00:00 EST
    ...>   1_546_362_000,
    ...>   Util.Time.parse_hhmmss("11:00:00")
    ...> )
    # 12:00:00
    43200

    # When the day_start is slightly after than the timestamp,
    # the previous day will be used as a reference and the result will be large
    iex> Util.Time.next_time_of_day_for_timestamp_after(
    ...>   # 2019-01-01 12:00:00 EST
    ...>   1_546_362_000,
    ...>   Util.Time.parse_hhmmss("13:00:00")
    ...> )
    # 36:00
    129_600

    # When the day_start belongs to the previous date.
    iex> Util.Time.next_time_of_day_for_timestamp_after(
    ...>   # 2019-01-02 01:00:00 EST
    ...>   1_546_408_800,
    ...>   Util.Time.parse_hhmmss("18:00:00")
    ...> )
    # 25:00:00
    90000

    # The day_start can be on the next date but same day of service
    iex> Util.Time.next_time_of_day_for_timestamp_after(
    ...>   # 2019-01-02 02:00:00 EST
    ...>   1_546_412_400,
    ...>   Util.Time.parse_hhmmss("25:00:00")
    ...> )
    # 26:00:00
    93600

  """
  @spec next_time_of_day_for_timestamp_after(timestamp(), time_of_day()) :: time_of_day()
  def next_time_of_day_for_timestamp_after(timestamp, day_start) do
    date_of_timestamp = date_of_timestamp(timestamp)

    on_same_date = time_of_day_for_timestamp(timestamp, date_of_timestamp)

    # if the day_start is after the naively calculated time_of_day for our timestamp,
    # then calculate relative to an earlier date so the resulting time_of_day is larger.
    # typically, this value will be 0 or -1
    days_to_move_forward = Integer.floor_div(on_same_date - day_start, 24 * 60 * 60)

    date_to_use = Timex.shift(date_of_timestamp, days: days_to_move_forward)

    time_of_day_for_timestamp(timestamp, date_to_use)
  end

  @doc """
    iex> Util.Time.time_of_day_for_timestamp(
    ...>   # 2019-01-02 01:00:00 EST
    ...>   1_546_408_800,
    ...>   ~D[2019-01-02]
    ...> )
    # 01:00:00
    3600

    iex> Util.Time.time_of_day_for_timestamp(
    ...>   # 2019-01-02 01:00:00 EST
    ...>   1_546_408_800,
    ...>   ~D[2019-01-01]
    ...> )
    # 25:00:00
    90000
  """
  @spec time_of_day_for_timestamp(timestamp(), Date.t()) :: time_of_day()
  def time_of_day_for_timestamp(timestamp, date) do
    noon = noon_on_date(date)
    seconds_after_noon = timestamp - noon
    seconds_after_noon + 12 * 60 * 60
  end

  @doc """
    iex> Util.Time.timestamp_for_time_of_day(
    ...>   # 01:00:00
    ...>   3600,
    ...>   ~D[2019-01-02]
    ...> )
    # 2019-01-02 01:00:00 EST
    1_546_408_800

    iex> Util.Time.timestamp_for_time_of_day(
    ...>   # 25:00:00
    ...>   90000,
    ...>   ~D[2019-01-01]
    ...> )
    # 2019-01-02 01:00:00 EST
    1_546_408_800
  """
  @spec timestamp_for_time_of_day(time_of_day(), Date.t()) :: timestamp()
  def timestamp_for_time_of_day(time_of_day, date) do
    noon = noon_on_date(date)
    twelve_hours_before_noon = noon - 12 * 60 * 60
    twelve_hours_before_noon + time_of_day
  end

  @doc """
    iex> Util.Time.time_of_day_add_minutes(
    ...>   # 10:00:00
    ...>   36000,
    ...>   30
    ...> )
    # 10:30:00
    37800

    iex> Util.Time.time_of_day_add_minutes(
    ...>   # 10:00:00
    ...>   36000,
    ...>   -30
    ...> )
    # 09:30:00
    34200
  """
  @spec time_of_day_add_minutes(time_of_day(), integer()) :: time_of_day()
  def time_of_day_add_minutes(time_of_day, minutes) do
    time_of_day + 60 * minutes
  end

  @doc """
  Converts a timestamp into a Date.

  iex> Util.Time.date_of_timestamp(1_546_362_000)
  ~D[2019-01-01]

  The date conversion is done in Eastern Time.
  This is the date that roles over at midnight, not the service date.
  """
  @spec date_of_timestamp(timestamp()) :: Date.t()
  def date_of_timestamp(timestamp) do
    timestamp
    |> DateTime.from_unix!(:second)
    |> Timex.Timezone.convert("America/New_York")
    |> DateTime.to_date()
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
