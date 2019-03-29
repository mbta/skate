defmodule Gtfs.Query do
  @moduledoc """
  Logic for queries to make against gtfs data
  """

  @type opts :: %{
          optional(:server) => GenServer.server()
        }

  @spec all_routes(opts()) :: [Gtfs.Route.t()]
  def all_routes(opts \\ %{}) do
    Gtfs.gtfs(opts).routes
  end
end
