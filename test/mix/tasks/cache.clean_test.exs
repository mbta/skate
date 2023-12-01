defmodule Mix.Tasks.Cache.CleanTest do
  use ExUnit.Case, async: true

  alias ExUnit.CaptureIO
  alias Schedule.CacheFile
  alias Mix.Tasks.Cache

  @test_cache_filepath CacheFile.generate_filepath(CacheFile.cache_filename())

  test "deletes the gtfs cache file" do
    File.touch(@test_cache_filepath)
    assert File.exists?(@test_cache_filepath)

    execute_run = fn ->
      Cache.Clean.run([])
    end

    assert CaptureIO.capture_io(execute_run) =~ "Deleting cache file"
    refute File.exists?(@test_cache_filepath)
  end
end
