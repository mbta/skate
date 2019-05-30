defmodule Gtfs.CacheFileTest do
  use ExUnit.Case, async: true

  alias Gtfs.CacheFile
  alias Gtfs.Data
  alias Gtfs.Route

  doctest CacheFile

  test "should_use_file?/0 returns true if there is a `cache_filename` application env var configured" do
    assert CacheFile.should_use_file?()
  end

  describe "save_gtfs/1 and load_gtfs/1" do
    test "saves to the default file, returns {:ok, term} for a map" do
      data = %Data{
        routes: [%Route{id: "1"}],
        route_patterns: [],
        stops: %{},
        trips: %{}
      }

      filepath = CacheFile.cache_filename() |> CacheFile.generate_filepath()

      assert CacheFile.save_gtfs(data) == :ok

      assert CacheFile.load_gtfs(filepath) == {:ok, data}

      File.rm!(filepath)
    end

    test "saves to a requested file, returns {:ok, term} for a map" do
      data = %Data{
        routes: [%Route{id: "2"}],
        route_patterns: [],
        stops: %{},
        trips: %{}
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

    assert filepath =~ "priv/gtfs_cache"
    assert filepath =~ "foo.bar"
  end
end
