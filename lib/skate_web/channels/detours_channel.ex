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
    detours = Detours.grouped_detours(user_id)[:active]
    {:ok, %{data: detours}, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("detours:active:" <> route_id, _message, socket) do
    SkateWeb.Endpoint.subscribe("detours:active:" <> route_id)
    detours = Detours.active_detours_by_route(route_id)
    {:ok, %{data: detours}, socket}
  end

  # Past
  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("detours:past", _message, socket) do
    SkateWeb.Endpoint.subscribe("detours:past")
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)
    detours = Detours.grouped_detours(user_id)[:past]
    {:ok, %{data: detours}, socket}
  end

  # Draft
  @impl SkateWeb.AuthenticatedChannel
  def join_authenticated("detours:draft:" <> author_uuid, _message, socket) do
    SkateWeb.Endpoint.subscribe("detours:draft:" <> author_uuid)
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)
    detours = Detours.grouped_detours(user_id)[:draft]
    {:ok, %{data: detours}, socket}
  end

  @impl SkateWeb.AuthenticatedChannel
  def handle_info_authenticated({:detour_activated, detour}, socket) do
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
