defmodule Schedule.CacheFileTest do
  use ExUnit.Case, async: true

  alias Schedule.CacheFile
  alias Schedule.Data
  alias Schedule.Gtfs.Route

  doctest CacheFile

  test "should_use_file?/0 returns true if there is a `cache_filename` application env var configured" do
    assert CacheFile.should_use_file?()
  end

  describe "save_gtfs/1 and load_gtfs/1" do
    test "saves to the default file, returns {:ok, term} for a map" do
      data = %Data{
        routes: [%Route{id: "1", direction_names: %{}, description: "Key Bus", name: "1"}],
        route_patterns: [],
        timepoints_by_route: %{},
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: %{},
        calendar: %{}
      }

      filepath = CacheFile.generate_filepath(CacheFile.cache_filename())

      assert CacheFile.save_gtfs(data) == :ok

      assert CacheFile.load_gtfs(filepath) == {:ok, data}

      File.rm!(filepath)
    end

    test "saves to a requested file, returns {:ok, term} for a map" do
      data = %Data{
        routes: [%Route{id: "2", direction_names: %{}, description: "Key Bus", name: "2"}],
        route_patterns: [],
        timepoints_by_route: %{},
        shapes: %{},
        stops: %{},
        trips: %{},
        blocks: %{},
        calendar: %{}
      }

      filepath = CacheFile.generate_filepath("load_gtfs_1_test_map.terms")

      assert CacheFile.save_gtfs(data, filepath) == :ok

      assert CacheFile.load_gtfs(filepath) == {:ok, data}

      File.rm!(filepath)
    end

    test "saving returns error for non-map" do
      payload = [:non_map]
      filepath = CacheFile.generate_filepath("load_gtfs_1_test_map.terms")

      assert CacheFile.save_gtfs(payload, filepath) == {:error, :cache_file_not_saved}
    end
  end

  test "cache_filename/0 returns a filename in test env" do
    assert CacheFile.cache_filename() == "test_cache.terms"
  end

  test "generate_filepath/1 given a filename returns a path" do
    filepath = CacheFile.generate_filepath("foo.bar")

    assert filepath =~ "priv/schedule_cache"
    assert filepath =~ "foo.bar"
  end
end
