defmodule Schedule.Gtfs.FetcherTest do
  use ExUnit.Case

  import Test.Support.Helpers

  describe "init/1" do
    test "sets correct initial state" do
      assert {:ok,
              %{
                poll_interval_ms: 100,
                health_server: Server,
                latest_gtfs_timestamp: nil,
                latest_hastus_timestamp: nil
              },
              {:continue, {:initial_poll, :remote}}} =
               Schedule.Gtfs.Fetcher.init(
                 poll_interval_ms: 100,
                 health_server: Server,
                 files_source: :remote
               )
    end
  end

  describe "fetch_remote_files/2" do
    test "successfully loads empty data" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)

      # empty zip file
      zip_binary =
        "UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA=="
        |> Base.decode64!()

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, zip_binary)
      end)

      assert {:files, _all_files} = Schedule.Gtfs.Fetcher.fetch_remote_files(nil, nil)
    end
  end

  describe "fetch_zip/2" do
    test "fetches and unzips zip file" do
      bypass = Bypass.open()
      url = "http://localhost:#{bypass.port}/test.zip"

      zip_binary =
        "UEsDBAoAAAAAAHJrSU+DFtyMAQAAAAEAAAABABwAZlVUCQADhxieXasYnl11eAsAAQT1AQAABBQAAAB4UEsBAh4DCgAAAAAAcmtJT4MW3IwBAAAAAQAAAAEAGAAAAAAAAQAAAKSBAAAAAGZVVAUAA4cYnl11eAsAAQT1AQAABBQAAABQSwUGAAAAAAEAAQBHAAAAPAAAAAAA"
        |> Base.decode64!()

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 200, zip_binary)
      end)

      assert Schedule.Gtfs.Fetcher.fetch_zip(url, ["f"]) == {:ok, %{"f" => "x"}}
    end
  end
end
