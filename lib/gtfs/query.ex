defmodule Gtfs.Query do
  @moduledoc """
  Logic for queries to make against gtfs data
  """

  @type opts :: %{
          optional(:server) => GenServer.server()
        }

  @spec all_stops(opts()) :: [Gtfs.Stop.t()]
  def all_stops(opts \\ %{}) do
    Gtfs.gtfs(opts).stops
  end
end
