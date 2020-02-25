defmodule Realtime.DataStatus do
  @type t :: :good | :outage

  @spec data_status() :: t()
  def data_status() do
    :good
  end
end
