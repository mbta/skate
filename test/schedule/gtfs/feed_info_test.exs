defmodule Schedule.Gtfs.FeedInfoTest do
  use ExUnit.Case, async: true
  import ExUnit.CaptureLog, only: [capture_log: 1]

  alias Schedule.Gtfs.FeedInfo

  @csv_row %{
    "feed_start_date" => "20200409",
    "feed_end_date" => "20200514",
    "feed_version" => "Spring 2020, 2020-04-16T08:39:02+00:00, version D"
  }

  @feed_info %FeedInfo{
    start_date: ~D[2020-04-09],
    end_date: ~D[2020-05-14],
    version: "Spring 2020, 2020-04-16T08:39:02+00:00, version D"
  }

  describe "from_csv_row/1" do
    test "builds a FeedInfo struct from a csv row" do
      assert FeedInfo.from_csv_row(@csv_row) == @feed_info
    end
  end

  describe "log_gtfs_version/1" do
    setup do
      log_level = Logger.level()

      on_exit(fn ->
        Logger.configure(level: log_level)
      end)

      Logger.configure(level: :info)
    end

    test "logs stand and end dates and version info for this feed" do
      log =
        capture_log(fn ->
          FeedInfo.log_gtfs_version(@feed_info)
        end)

      assert log =~
               "Importing GTFS feed: start_date=2020-04-09 end_date=2020-05-14 version=Spring 2020, 2020-04-16T08:39:02+00:00, version D"
    end
  end
end
