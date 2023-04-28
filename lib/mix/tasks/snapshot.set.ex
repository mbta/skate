defmodule Mix.Tasks.Snapshot.Set do
  @moduledoc """
  Download the data sources we use into a folder to use as a snapshot in time
  """

  use Mix.Task

  @impl Mix.Task
  def run([file]) do
    source_path = ~s(./snapshots/source)
    File.rm(source_path)
    File.ln_s!(file, source_path)
  end
end
