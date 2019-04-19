defmodule Gtfs.CacheFileTest do
  use ExUnit.Case, async: true

  alias Gtfs.CacheFile
  alias Gtfs.Route

  doctest CacheFile

  test "should_use_file?/0 returns true if there is a `cache_filename` application env var configured" do
    assert CacheFile.should_use_file?()
  end

  describe "load_gtfs/1" do
    test "returns {:ok, term} for a map" do
      data = %Gtfs{
        routes: [%Route{id: "1"}],
        route_patterns: [],
        stops: [],
        trip_timepoints: %{},
        trips: []
      }

      filepath = CacheFile.generate_filepath("load_gtfs_1_test_map.terms")

      assert CacheFile.save_gtfs(data, filepath) == :ok
      assert CacheFile.load_gtfs(filepath) == {:ok, data}
    end

    test "returns error for non-map" do
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

    assert filepath =~ "priv/gtfs_cache"
    assert filepath =~ "foo.bar"
  end
end
