defmodule Concentrate.Sink.Filesystem do
  @moduledoc """
  Sink which writes files to the local filesytem.
  """
  require Logger

  def start_link(opts, {filename, body}) do
    directory = Keyword.fetch!(opts, :directory)

    Task.start_link(fn ->
      path = Path.join(directory, filename)
      directory = Path.dirname(path)
      File.mkdir_p!(directory)
      File.write!(path, body)

      Logger.info(fn ->
        "#{__MODULE__} updated: path=#{inspect(path)} bytes=#{byte_size(body)}"
      end)
    end)
  end
end
