defmodule Schedule.Gtfs.FeedInfo do
  @moduledoc false

  require Logger

  alias Schedule.Csv

  @type t :: %__MODULE__{
          start_date: Date.t(),
          end_date: Date.t(),
          version: String.t()
        }

  @enforce_keys [
    :start_date,
    :end_date,
    :version
  ]

  defstruct [
    :start_date,
    :end_date,
    :version
  ]

  @spec parse(binary()) :: t()
  def parse(file_binary) do
    file_binary
    |> Csv.parse(parse: &from_csv_row/1)
    |> List.first()
  end

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      start_date: date(row["feed_start_date"]),
      end_date: date(row["feed_end_date"]),
      version: row["feed_version"]
    }
  end

  @spec log_gtfs_version(t() | nil) :: :ok
  # Handle missing data to keep testing simpler
  def log_gtfs_version(nil), do: :ok

  def log_gtfs_version(%__MODULE__{start_date: start_date, end_date: end_date, version: version}) do
    Logger.info(fn ->
      "Importing GTFS feed: start_date=#{start_date} end_date=#{end_date} version=#{version}"
    end)
  end

  @spec date(String.t()) :: Date.t()
  defp date(<<year_str::binary-4, month_str::binary-2, day_str::binary-2>>) do
    Date.from_erl!({
      String.to_integer(year_str),
      String.to_integer(month_str),
      String.to_integer(day_str)
    })
  end
end
