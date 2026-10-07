defmodule SkateWeb.ResearchScenarioChannel do
  @moduledoc """
  Phoenix Channel for managing and broadcasting UX research scenarios.
  Supports generic subtopics matching `research:scenarios:*`.
  """

  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  alias Skate.Research.ScenarioStore

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("research:scenarios:" <> subtopic, _payload, socket) do
    current_scenario = ScenarioStore.get(subtopic)
    {:ok, %{data: current_scenario}, assign(socket, :subtopic, subtopic)}
  end

  def join_authenticated(topic, _payload, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_in_authenticated("trigger_scenario", payload, socket) do
    subtopic = socket.assigns.subtopic
    ScenarioStore.set(subtopic, payload)
    broadcast!(socket, "scenario_triggered", %{data: payload})
    {:reply, {:ok, %{data: payload}}, socket}
  end

  def handle_in_authenticated("reset_scenario", _payload, socket) do
    subtopic = socket.assigns.subtopic
    ScenarioStore.reset(subtopic)
    broadcast!(socket, "scenario_reset", %{data: nil})
    {:reply, :ok, socket}
  end
end
