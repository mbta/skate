defmodule Skate.Research.ScenarioStore do
  @moduledoc """
  Agent-based in-memory store for active UX research scenarios keyed by subtopic.
  Enables late-joining participants in a research session to retrieve the currently active scenario.
  """

  use Agent

  @spec start_link(keyword()) :: Agent.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    Agent.start_link(fn -> %{} end, name: name)
  end

  @spec get(String.t(), GenServer.server()) :: map() | nil
  def get(subtopic, name \\ __MODULE__) do
    Agent.get(name, &Map.get(&1, subtopic))
  end

  @spec set(String.t(), map(), GenServer.server()) :: :ok
  def set(subtopic, scenario, name \\ __MODULE__) do
    Agent.update(name, &Map.put(&1, subtopic, scenario))
  end

  @spec reset(String.t(), GenServer.server()) :: :ok
  def reset(subtopic, name \\ __MODULE__) do
    Agent.update(name, &Map.delete(&1, subtopic))
  end

  @spec reset_all(GenServer.server()) :: :ok
  def reset_all(name \\ __MODULE__) do
    Agent.update(name, fn _ -> %{} end)
  end
end
