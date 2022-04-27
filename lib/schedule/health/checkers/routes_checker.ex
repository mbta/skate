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

    length = routes_fn.() |> length()
    passfail = length >= min_length

    if(!passfail) do
      Logger.warning("Routes Checker failed. min_legth=#{min_length} length=#{length}")
    end

    passfail
  end
end
