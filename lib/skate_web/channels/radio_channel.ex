defmodule SkateWeb.RadioChannel do
  @moduledoc "Phoenix channel for radio entity snapshots and updates."

  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  alias Skate.Radio.Store

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("radio:rtts", _payload, socket), do: join_collection("rtts", socket)

  def join_authenticated("radio:rtts:" <> id, _payload, socket) when id != "",
    do: join_individual("rtts", id, socket)

  def join_authenticated("radio:prtts", _payload, socket), do: join_collection("prtts", socket)

  def join_authenticated("radio:prtts:" <> id, _payload, socket) when id != "",
    do: join_individual("prtts", id, socket)

  def join_authenticated("radio:emergencies", _payload, socket),
    do: join_collection("emergencies", socket)

  def join_authenticated("radio:emergencies:" <> id, _payload, socket) when id != "",
    do: join_individual("emergencies", id, socket)

  def join_authenticated("radio:calls", _payload, socket), do: join_collection("calls", socket)

  def join_authenticated("radio:calls:" <> id, _payload, socket) when id != "",
    do: join_individual("calls", id, socket)

  def join_authenticated(topic, _payload, _socket) do
    {:error, %{message: "no such topic \"#{topic}\""}}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:radio_updated, topic, data}, %{topic: topic} = socket) do
    :ok = push(socket, "radio_updated", %{data: data})
    {:noreply, socket}
  end

  def handle_info_authenticated(_message, socket), do: {:noreply, socket}

  defp join_collection(type, socket) do
    :ok = Phoenix.PubSub.subscribe(Skate.PubSub, "radio:#{type}")
    {:ok, %{data: Store.all(type)}, socket}
  end

  defp join_individual(type, id, socket) do
    if String.contains?(id, ":") do
      {:error, %{message: "no such topic \"radio:#{type}:#{id}\""}}
    else
      :ok = Phoenix.PubSub.subscribe(Skate.PubSub, "radio:#{type}:#{id}")
      {:ok, %{data: Store.get(type, id)}, socket}
    end
  end
end
