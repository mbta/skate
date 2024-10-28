defmodule Mix.Tasks.Cache.Clean do
  @moduledoc """
  Clean the gtfs data cache file for the current environment.
  """
  use Mix.Task
  alias Schedule.CacheFile

  @shortdoc "Delete the gtfs cache file"
  @spec run([binary]) :: any
  def run(_) do
    filepath = CacheFile.generate_filepath(CacheFile.cache_filename())

    IO.puts("Deleting cache file #{filepath}")
    File.rm(filepath)
  end
end
