defmodule Schedule.Health.Checkers.TimepointsChecker do
  @moduledoc """
  Check that Schedules returns at least a minimum number of timepoints for each configured route.
  """
  require Logger

  @type config :: [timepoint_config()]
  @type timepoint_config :: %{
          route_id: String.t(),
          min_length: non_neg_integer()
        }

  @spec healthy?(config()) :: boolean
  def healthy?(timepoint_configs) when is_list(timepoint_configs),
    do: Enum.all?(timepoint_configs, &healthy_route?/1)

  @spec healthy_route?(timepoint_config()) :: boolean
  defp healthy_route?(%{route_id: route_id, min_length: min_length}) do
    timepoints_on_route_fn =
      Application.get_env(:skate_web, :timepoints_on_route_fn, &Schedule.timepoints_on_route/1)

    length = route_id |> timepoints_on_route_fn.() |> length()
    pass? = length >= min_length

    if !pass? do
      Logger.warning(
        "#{__MODULE__} failed on route_id=#{route_id}. min_length=#{min_length} length=#{length}"
      )
    end

    pass?
  end
end
