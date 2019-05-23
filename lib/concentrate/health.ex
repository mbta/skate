defmodule Concentrate.Health do
  @moduledoc """
  Simple server to return whether Concentrate is healthy.
  """
  use Agent
  require Logger

  def start_link(opts) do
    Agent.start_link(fn -> true end, opts)
  end

  def healthy?(name \\ __MODULE__) do
    Agent.get(name, fn state ->
      _ =
        Logger.info(fn ->
          "#{__MODULE__} Checking health..."
        end)

      state
    end)
  end
end
