defmodule Gtfs.Query do
  @moduledoc """
  Logic for queries to make against gtfs data
  """

  @spec all_stops() :: [Gtfs.Stop.t()]
  def all_stops() do
    Gtfs.gtfs().stops
  end
end
