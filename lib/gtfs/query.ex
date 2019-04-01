defmodule Gtfs.Query do
  @moduledoc """
  Logic for queries to make against gtfs data
  """

  alias Gtfs.Route

  @type opts :: %{
          optional(:server) => GenServer.server()
        }

  @spec all_routes(opts()) :: [Route.t()]
  def all_routes(opts \\ %{}) do
    Gtfs.gtfs(opts).routes
  end
end
