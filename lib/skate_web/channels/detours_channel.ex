defmodule SkateWeb.DetoursChannel do
  @moduledoc false

  use SkateWeb, :channel
  use SkateWeb.AuthenticatedChannel

  alias Skate.Detours.Detours

  # Active
  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("detours:active", _message, socket) do
    SkateWeb.Endpoint.subscribe("detours:active")
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)
    detours = Detours.detours_for_user(user_id, :active)
    {:ok, %{data: detours}, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("detours:active:" <> route_id, _message, socket) do
    SkateWeb.Endpoint.subscribe("detours:active:" <> route_id)
    detours = Detours.detours_for_route(route_id, :active)
    {:ok, %{data: detours}, socket}
  end

  # Past
  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("detours:past", _message, socket) do
    SkateWeb.Endpoint.subscribe("detours:past")
    detours = Detours.detours_for_route("all", :past)
    {:ok, %{data: detours}, socket}
  end

  # Past By Route
  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("detours:past:" <> route_id, _message, socket) do
    SkateWeb.Endpoint.subscribe("detours:past:" <> route_id)
    detours = Detours.detours_for_route(route_id, :past)
    {:ok, %{data: detours}, socket}
  end

  # Draft
  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("detours:draft:" <> author_uuid, _message, socket) do
    SkateWeb.Endpoint.subscribe("detours:draft:" <> author_uuid)
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)
    detours = Detours.detours_for_user(user_id, :draft)
    {:ok, %{data: detours}, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_in_authenticated("paginate", %{"limit" => limit, "offset" => offset}, socket) do
    with {:ok, limit} <- parse_integer(limit),
         {:ok, offset} <- parse_integer(offset) do
      detours = fetch_paginated_detours(socket, limit, offset)
      {:reply, {:ok, %{data: detours}}, socket}
    else
      _ ->
        {:reply, {:error, %{reason: :invalid_pagination}}, socket}
    end
  end

  def handle_in_authenticated("paginate", _payload, socket) do
    {:reply, {:error, %{reason: :invalid_pagination}}, socket}
  end

  defp parse_integer(value) when is_integer(value), do: {:ok, value}

  defp parse_integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> {:ok, parsed}
      _ -> :error
    end
  end

  defp parse_integer(_), do: :error

  defp fetch_paginated_detours(%{topic: "detours:active"} = socket, limit, offset) do
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)
    Detours.detours_for_user(user_id, :active, limit, offset)
  end

  defp fetch_paginated_detours(%{topic: "detours:active:" <> route_id}, limit, offset) do
    Detours.detours_for_route(route_id, :active, limit, offset)
  end

  defp fetch_paginated_detours(%{topic: "detours:past"}, limit, offset) do
    Detours.detours_for_route("all", :past, limit, offset)
  end

  defp fetch_paginated_detours(%{topic: "detours:past:" <> route_id}, limit, offset) do
    Detours.detours_for_route(route_id, :past, limit, offset)
  end

  defp fetch_paginated_detours(%{topic: "detours:draft:" <> _author_uuid} = socket, limit, offset) do
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)
    Detours.detours_for_user(user_id, :draft, limit, offset)
  end

  defp fetch_paginated_detours(_socket, _limit, _offset), do: []

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated(
        {:detour_activated, %Skate.Detours.Detour.Simple{} = detour},
        socket
      ) do
    :ok = push(socket, "activated", %{data: detour})
    {:noreply, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:detour_deactivated, detour}, socket) do
    :ok = push(socket, "deactivated", %{data: detour})
    {:noreply, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:detour_drafted, detour}, socket) do
    :ok = push(socket, "drafted", %{data: detour})
    {:noreply, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:draft_detour_deleted, detour_id}, socket) do
    :ok = push(socket, "deleted", %{data: detour_id})
    {:noreply, socket}
  end
end
