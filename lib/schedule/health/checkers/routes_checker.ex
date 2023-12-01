defmodule Schedule.Health.Checkers.RoutesChecker do
  @moduledoc """
  Check that Schedules returns at least a minimum number of routes.
  """
  require Logger

  @type config :: %{
          min_length: non_neg_integer()
        }

  @spec healthy?(config) :: boolean
  def healthy?(%{min_length: min_length}) do
    routes_fn = Application.get_env(:skate_web, :routes_fn, &Schedule.all_routes/0)

    length = length(routes_fn.())
    pass? = length >= min_length

    if !pass? do
      Logger.warning("#{__MODULE__} failed. min_length=#{min_length} length=#{length}")
    end

    pass?
  end
end
