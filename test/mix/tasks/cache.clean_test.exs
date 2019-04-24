defmodule Mix.Tasks.Cache.CleanTest do
  use ExUnit.Case, async: true

  alias Gtfs.CacheFile
  alias Mix.Tasks.Cache

  @test_cache_filepath CacheFile.cache_filename() |> CacheFile.generate_filepath()

  test "deletes the gtfs cache file" do
    File.touch(@test_cache_filepath)
    assert File.exists?(@test_cache_filepath)

    Cache.Clean.run([])

    refute File.exists?(@test_cache_filepath)
  end
end
