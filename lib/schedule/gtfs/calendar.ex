defmodule Schedule.Gtfs.Calendar do
  @moduledoc false

  alias Schedule.Csv
  alias Schedule.Gtfs.Service

  @type t :: %{Date.t() => [Service.id()]}

  @typep gtfs_calendar_row :: %{
           service_id: Service.id(),
           monday: boolean(),
           tuesday: boolean(),
           wednesday: boolean(),
           thursday: boolean(),
           friday: boolean(),
           saturday: boolean(),
           sunday: boolean(),
           start_date: Date.t(),
           end_date: Date.t()
         }

  @typep gtfs_calendar_date_row :: %{
           service_id: Service.id(),
           date: Date.t(),
           exception_type: :added | :removed
         }

  @spec from_files(binary() | nil, binary() | nil) :: t()
  def from_files(calendar_file, calendar_dates_file) do
    gtfs_calendar = Csv.parse(calendar_file, parse: &calendar_from_csv_row/1)

    gtfs_calendar_dates = Csv.parse(calendar_dates_file, parse: &calendar_date_from_csv_row/1)

    calendar_from_gtfs(gtfs_calendar, gtfs_calendar_dates)
  end

  @spec calendar_from_csv_row(Csv.row()) :: gtfs_calendar_row()
  defp calendar_from_csv_row(row) do
    %{
      service_id: row["service_id"],
      monday: boolean(row["monday"]),
      tuesday: boolean(row["tuesday"]),
      wednesday: boolean(row["wednesday"]),
      thursday: boolean(row["thursday"]),
      friday: boolean(row["friday"]),
      saturday: boolean(row["saturday"]),
      sunday: boolean(row["sunday"]),
      start_date: from_iso8601!(row["start_date"]),
      end_date: from_iso8601!(row["end_date"])
    }
  end

  @spec calendar_date_from_csv_row(Csv.row()) :: gtfs_calendar_date_row()
  defp calendar_date_from_csv_row(row) do
    %{
      service_id: row["service_id"],
      date: from_iso8601!(row["date"]),
      exception_type: exception_type(row["exception_type"])
    }
  end

  @spec boolean(String.t()) :: boolean()
  defp boolean("0"), do: false
  defp boolean("1"), do: true

  @spec exception_type(String.t()) :: :added | :removed
  defp exception_type("1"), do: :added
  defp exception_type("2"), do: :removed

  @spec calendar_from_gtfs([gtfs_calendar_row()], [gtfs_calendar_date_row()]) :: t()
  defp calendar_from_gtfs(gtfs_calendar_rows, gtfs_calendar_dates) do
    gtfs_calendar_rows
    |> calendar_from_gtfs_raw()
    |> add_remove_dates(gtfs_calendar_dates)
  end

  @spec calendar_from_gtfs_raw([gtfs_calendar_row()]) :: t()
  defp calendar_from_gtfs_raw(gtfs_calendar_rows) do
    gtfs_calendar_rows
    |> Enum.flat_map(fn calendar_row ->
      calendar_row
      |> active_dates()
      |> Enum.map(fn date -> {date, calendar_row.service_id} end)
    end)
    |> Enum.group_by(fn {date, _service_id} -> date end, fn {_date, service_id} -> service_id end)
  end

  @spec active_dates(gtfs_calendar_row()) :: [Date.t()]
  defp active_dates(calendar_row) do
    dates = Date.range(calendar_row.start_date, calendar_row.end_date)

    Enum.filter(dates, fn date ->
      case Date.day_of_week(date) do
        1 -> calendar_row.monday
        2 -> calendar_row.tuesday
        3 -> calendar_row.wednesday
        4 -> calendar_row.thursday
        5 -> calendar_row.friday
        6 -> calendar_row.saturday
        7 -> calendar_row.sunday
      end
    end)
  end

  @spec add_remove_dates(t(), [gtfs_calendar_date_row()]) :: t()
  defp add_remove_dates(calendar, gtfs_calendar_dates) do
    {adds, removes} =
      Enum.split_with(gtfs_calendar_dates, fn calendar_date ->
        calendar_date.exception_type == :added
      end)

    calendar =
      Enum.reduce(removes, calendar, fn remove, calendar ->
        Map.update(calendar, remove.date, [], fn ids -> List.delete(ids, remove.service_id) end)
      end)

    calendar =
      Enum.reduce(adds, calendar, fn add, calendar ->
        Map.update(calendar, add.date, [add.service_id], fn ids -> [add.service_id | ids] end)
      end)

    calendar
  end

  # GTFS uses 20190101 instead of 2019-01-01
  @spec from_iso8601!(String.t()) :: Date.t()
  defp from_iso8601!(yyyymmdd) do
    <<yyyy::bytes-size(4)>> <> <<mm::bytes-size(2)>> <> <<dd::bytes-size(2)>> = yyyymmdd
    yyyy_mm_dd = "#{yyyy}-#{mm}-#{dd}"
    Date.from_iso8601!(yyyy_mm_dd)
  end
end
