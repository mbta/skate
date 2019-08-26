defmodule SkateWeb.ShuttleVehiclesChannel do
  use SkateWeb, :channel

  alias Realtime.{Servers.ShuttleVehicles}
  alias SkateWeb.Channels.Helpers

  @impl Phoenix.Channel
  def join("shuttles:run_ids", _message, socket) do
    run_ids = ShuttleVehicles.subscribe_to_run_ids()
    {:ok, run_ids, socket}
  end

  def join("shuttles:all", _message, socket) do
    all_shuttles = ShuttleVehicles.subscribe_to_all_shuttles()
    {:ok, all_shuttles, socket}
  end

  def join("shuttles:" <> run_id, _message, socket) do
    shuttles_for_run = ShuttleVehicles.subscribe_to_run(run_id)
    {:ok, shuttles_for_run, socket}
  end

  def join(topic, _message, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl Phoenix.Channel
  def handle_info({:new_realtime_data, data}, socket) do
    Helpers.push_or_refresh(socket, fn -> push_data(socket, data) end)
  end

  @spec push_data(Phoenix.Socket.t(), ShuttleVehicles.broadcast_data()) ::
          {:noreply, Phoenix.Socket.t()}
  defp push_data(socket, {:shuttles, shuttles}) do
    push(socket, "shuttles", %{data: shuttles})
    {:noreply, socket}
  end

  defp push_data(socket, {:run_ids, run_ids}) do
    push(socket, "run_ids", %{data: run_ids})
    {:noreply, socket}
  end
end
