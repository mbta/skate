defmodule Util.Duration do
  @moduledoc """
  Duration related utility functions.
  """
  require Logger

  @doc """
  Logs how long a function call took.
  """
  @spec log_duration(atom, atom, [any]) :: any
  def log_duration(module, function, args) do
    {time, result} = :timer.tc(module, function, args)
    time = time / :timer.seconds(1)

    _ =
      Logger.info(fn ->
        "Function duration, module=#{module} function=#{function} duration=#{time}"
      end)

    result
  end
end
