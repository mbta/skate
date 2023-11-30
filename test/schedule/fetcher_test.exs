defmodule Schedule.FetcherTest do
  use ExUnit.Case
  import ExUnit.CaptureLog

  import Test.Support.Helpers

  describe "start_link/1" do
    test "starts GenServer" do
      assert {:ok, _pid} =
               Schedule.Fetcher.start_link(
                 health_server: nil,
                 updater_function: fn _ -> :ok end,
                 files_source: {:mocked_files, %{}}
               )
    end
  end

  describe "do_poll/2" do
    test "handles successful fetch" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)
      reassign_env(:skate, Schedule.CacheFile, cache_filename: nil)
      set_log_level(:info)

      # empty zip file
      zip_binary = Base.decode64!("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==")

      Bypass.expect(bypass, fn conn ->
        conn
        |> Plug.Conn.put_resp_header("last-modified", "foo")
        |> Plug.Conn.resp(200, zip_binary)
      end)

      log =
        capture_log(
          [level: :info],
          fn ->
            assert {:noreply, %{latest_gtfs_timestamp: "foo", latest_hastus_timestamp: "foo"},
                    :hibernate} =
                     Schedule.Fetcher.do_poll(
                       %{
                         poll_interval_ms: 50,
                         health_server: self(),
                         updater_function: fn _data -> :ok end,
                         latest_gtfs_timestamp: nil,
                         latest_hastus_timestamp: nil,
                         files_source: :remote
                       },
                       true
                     )

            assert_receive({:"$gen_cast", :loaded}, 5000)
          end
        )

      assert log =~ ~r/Sent updated schedule data to receiving process, time_in_ms=\d+/
      assert log =~ "Successfully loaded schedule data"
    end

    test "handles case with no updates" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)
      reassign_env(:skate, Schedule.CacheFile, cache_filename: nil)
      set_log_level(:info)

      Bypass.expect(bypass, fn conn ->
        conn
        |> Plug.Conn.put_resp_header("last-modified", "foo")
        |> Plug.Conn.resp(304, "")
      end)

      assert {:noreply, %{latest_gtfs_timestamp: "foo", latest_hastus_timestamp: "foo"}} =
               Schedule.Fetcher.do_poll(
                 %{
                   poll_interval_ms: 50,
                   health_server: self(),
                   updater_function: fn _data -> :ok end,
                   latest_gtfs_timestamp: "foo",
                   latest_hastus_timestamp: "foo",
                   files_source: :remote
                 },
                 true
               )
    end

    test "handles errors with fetching / parsing" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)
      reassign_env(:skate, Schedule.CacheFile, cache_filename: nil)
      set_log_level(:info)

      # Mismatch in number of columns per line to trigger CSV parse error
      {:ok, {~c"file.zip", zip_binary}} =
        :zip.zip(~c"file.zip", [{~c"calendar.txt", "column_1,column_2\n1,2,3"}], [:memory])

      Bypass.expect(bypass, fn conn ->
        conn
        |> Plug.Conn.put_resp_header("last-modified", "foo")
        |> Plug.Conn.resp(200, zip_binary)
      end)

      log =
        capture_log(
          [level: :info],
          fn ->
            assert {:noreply, %{latest_gtfs_timestamp: nil, latest_hastus_timestamp: nil}} =
                     Schedule.Fetcher.do_poll(
                       %{
                         poll_interval_ms: 50,
                         health_server: self(),
                         updater_function: fn _data -> :ok end,
                         latest_gtfs_timestamp: nil,
                         latest_hastus_timestamp: nil,
                         files_source: :remote
                       },
                       true
                     )

            refute_receive({:"$gen_cast", :loaded}, 50)
          end
        )

      assert log =~ "Error loading schedule data"
    end

    test "successfully loads schedule data from local cache" do
      filepath = Schedule.CacheFile.generate_filepath("fetcher_successful_test.terms")

      on_exit(fn -> File.rm!(filepath) end)

      data = %Schedule.Data{
        routes: [],
        route_patterns: [],
        timepoints_by_route: %{},
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: %{},
        calendar: %{}
      }

      :ok = Schedule.CacheFile.save_gtfs(data, filepath)

      reassign_env(:skate, Schedule.CacheFile, cache_filename: "fetcher_successful_test.terms")

      set_log_level(:info)

      log =
        capture_log([level: :info], fn ->
          assert {:stop, :normal, %{latest_gtfs_timestamp: nil, latest_hastus_timestamp: nil}} =
                   Schedule.Fetcher.do_poll(
                     %{
                       poll_interval_ms: 50,
                       health_server: self(),
                       updater_function: fn _data -> :ok end,
                       latest_gtfs_timestamp: nil,
                       latest_hastus_timestamp: nil,
                       files_source: :remote
                     },
                     true
                   )
        end)

      assert log =~ "Loading schedule data from cached file"
    end

    test "handles successful fetch after failed attempt at reading cache" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)
      reassign_env(:skate, Schedule.CacheFile, cache_filename: "non_existent_cache.terms")

      filepath = Schedule.CacheFile.generate_filepath("non_existent_cache.terms")

      on_exit(fn -> File.rm(filepath) end)

      set_log_level(:info)

      # empty zip file
      zip_binary = Base.decode64!("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==")

      Bypass.expect(bypass, fn conn ->
        conn
        |> Plug.Conn.put_resp_header("last-modified", "foo")
        |> Plug.Conn.resp(200, zip_binary)
      end)

      log =
        capture_log(
          [level: :info],
          fn ->
            assert {:noreply, %{latest_gtfs_timestamp: "foo", latest_hastus_timestamp: "foo"},
                    :hibernate} =
                     Schedule.Fetcher.do_poll(
                       %{
                         poll_interval_ms: 50,
                         health_server: self(),
                         updater_function: fn _data -> :ok end,
                         latest_gtfs_timestamp: nil,
                         latest_hastus_timestamp: nil,
                         files_source: :remote
                       },
                       true
                     )

            assert_receive({:"$gen_cast", :loaded}, 5000)
          end
        )

      assert log =~ ~r/Sent updated schedule data to receiving process, time_in_ms=\d+/
      assert log =~ "Successfully loaded schedule data"
      assert log =~ "Saving gtfs cache"
    end
  end

  describe "handle_info/2" do
    test "handles :check_gtfs message" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)
      reassign_env(:skate, Schedule.CacheFile, cache_filename: nil)
      set_log_level(:info)

      # empty zip file
      zip_binary = Base.decode64!("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==")

      Bypass.expect(bypass, fn conn ->
        conn
        |> Plug.Conn.put_resp_header("last-modified", "foo")
        |> Plug.Conn.resp(200, zip_binary)
      end)

      log =
        capture_log(
          [level: :info],
          fn ->
            assert {:noreply, %{latest_gtfs_timestamp: "foo", latest_hastus_timestamp: "foo"},
                    :hibernate} =
                     Schedule.Fetcher.handle_info(
                       :check_gtfs,
                       %{
                         poll_interval_ms: 50,
                         health_server: self(),
                         updater_function: fn _data -> :ok end,
                         latest_gtfs_timestamp: nil,
                         latest_hastus_timestamp: nil,
                         files_source: :remote
                       }
                     )

            refute_receive({:"$gen_cast", :loaded}, 50)
          end
        )

      assert log =~ ~r/Sent updated schedule data to receiving process, time_in_ms=\d+/
      assert log =~ "Successfully loaded schedule data"
    end
  end

  describe "init/1" do
    test "sets correct initial state" do
      assert {:ok,
              %{
                poll_interval_ms: 100,
                health_server: Server,
                latest_gtfs_timestamp: nil,
                latest_hastus_timestamp: nil,
                files_source: :remote
              },
              {:continue, :initial_poll}} =
               Schedule.Fetcher.init(
                 poll_interval_ms: 100,
                 health_server: Server,
                 files_source: :remote
               )
    end
  end

  describe "fetch_remote_files/2" do
    test "successfully fetches when both files updated" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)

      # empty zip file
      zip_binary = Base.decode64!("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==")

      Bypass.expect(bypass, fn conn ->
        conn
        |> Plug.Conn.put_resp_header("last-modified", "foo")
        |> Plug.Conn.resp(200, zip_binary)
      end)

      assert {:files, _all_files, "foo", "foo"} = Schedule.Fetcher.fetch_remote_files(nil, nil)
    end

    test "successfully fetches when only GTFS updated" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)

      # empty zip file
      zip_binary = Base.decode64!("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==")

      Bypass.expect(bypass, fn conn ->
        request_url = Plug.Conn.request_url(conn)

        if request_url =~ "MBTA_GTFS.zip" and
             "foo" in Plug.Conn.get_req_header(conn, "if-modified-since") do
          conn
          |> Plug.Conn.put_resp_header("last-modified", "bar")
          |> Plug.Conn.resp(200, zip_binary)
        else
          conn
          |> Plug.Conn.put_resp_header("last-modified", "foo")
          |> Plug.Conn.resp(304, "")
        end
      end)

      assert {:files, _all_files, "bar", "foo"} =
               Schedule.Fetcher.fetch_remote_files("foo", "foo")
    end

    test "successfully fetches when only HASTUS updated" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)

      # empty zip file
      zip_binary = Base.decode64!("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==")

      Bypass.expect(bypass, fn conn ->
        request_url = Plug.Conn.request_url(conn)

        if request_url =~ "hastus_skate_dev.zip" and
             "foo" in Plug.Conn.get_req_header(conn, "if-modified-since") do
          conn
          |> Plug.Conn.put_resp_header("last-modified", "bar")
          |> Plug.Conn.resp(200, zip_binary)
        else
          conn
          |> Plug.Conn.put_resp_header("last-modified", "foo")
          |> Plug.Conn.resp(304, "")
        end
      end)

      assert {:files, _all_files, "foo", "bar"} =
               Schedule.Fetcher.fetch_remote_files("foo", "foo")
    end

    test "handles case when neither file updated" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)

      Bypass.expect(bypass, fn conn ->
        conn
        |> Plug.Conn.put_resp_header("last-modified", "foo")
        |> Plug.Conn.resp(304, "")
      end)

      assert :no_update = Schedule.Fetcher.fetch_remote_files("foo", "foo")
    end

    test "handles error in initial fetch" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)

      Bypass.expect(bypass, fn conn ->
        Plug.Conn.resp(conn, 503, "")
      end)

      assert {:error, _error} = Schedule.Fetcher.fetch_remote_files(nil, nil)
    end

    test "handles error in followup fetch of non-updated files" do
      bypass = Bypass.open()
      gtfs_url = "http://localhost:#{bypass.port}/MBTA_GTFS.zip"
      hastus_url = "http://localhost:#{bypass.port}/hastus_skate_dev.zip"
      reassign_env(:skate, :gtfs_url, gtfs_url)
      reassign_env(:skate, :hastus_url, hastus_url)

      # empty zip file
      zip_binary = Base.decode64!("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==")

      Bypass.expect(bypass, fn conn ->
        request_url = Plug.Conn.request_url(conn)

        cond do
          request_url =~ "MBTA_GTFS.zip" and
              "foo" in Plug.Conn.get_req_header(conn, "if-modified-since") ->
            conn
            |> Plug.Conn.put_resp_header("last-modified", "bar")
            |> Plug.Conn.resp(200, zip_binary)

          request_url =~ "hastus_skate_dev.zip" and
              "foo" in Plug.Conn.get_req_header(conn, "if-modified-since") ->
            conn
            |> Plug.Conn.put_resp_header("last-modified", "foo")
            |> Plug.Conn.resp(304, "")

          true ->
            Plug.Conn.resp(conn, 503, "")
        end
      end)

      assert {:error, _error} = Schedule.Fetcher.fetch_remote_files("foo", "foo")
    end
  end

  describe "fetch_zip/3" do
    test "fetches and unzips zip file" do
      bypass = Bypass.open()
      url = "http://localhost:#{bypass.port}/test.zip"

      zip_binary =
        Base.decode64!(
          "UEsDBAoAAAAAAHJrSU+DFtyMAQAAAAEAAAABABwAZlVUCQADhxieXasYnl11eAsAAQT1AQAABBQAAAB4UEsBAh4DCgAAAAAAcmtJT4MW3IwBAAAAAQAAAAEAGAAAAAAAAQAAAKSBAAAAAGZVVAUAA4cYnl11eAsAAQT1AQAABBQAAABQSwUGAAAAAAEAAQBHAAAAPAAAAAAA"
        )

      Bypass.expect(bypass, fn conn ->
        conn
        |> Plug.Conn.put_resp_header("last-modified", "foo")
        |> Plug.Conn.resp(200, zip_binary)
      end)

      assert Schedule.Fetcher.fetch_zip(url, ["f"], nil) == {:ok, %{"f" => "x"}, "foo"}
    end
  end
end
