defmodule Schedule.Health.Checker do
  @moduledoc """
  Run through schedule data checks to confirm that things appear healthy.

  Checks are configured using the :schedule_health_checks configuration property.
  """

  alias Schedule.Health.Checkers.{RoutesChecker, TimepointsChecker, TripStopTimesChecker}

  @checkers Application.compile_env(:skate, :schedule_health_checks)

  @spec healthy?() :: boolean
  def healthy? do
    @checkers
    |> Stream.map(&checker/1)
    |> Enum.all?()
  end

  @spec checker({atom, map()}) :: boolean
  defp checker({:routes, config}), do: RoutesChecker.healthy?(config)
  defp checker({:timepoints, config}), do: TimepointsChecker.healthy?(config)
  defp checker({:trip_stop_times, config}), do: TripStopTimesChecker.healthy?(config)
end
