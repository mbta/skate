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

  # Return a certain range of detours, determined by limit and offset
  @impl SkateWeb.AuthenticatedChannel
  def handle_in_authenticated("paginate", %{"limit" => limit, "offset" => offset} = payload, socket) do
    with {:ok, limit} <- parse_integer(limit),
         {:ok, offset} <- parse_integer(offset),
         :ok <- validate_pagination(limit, offset),
         {:ok, filters} <- parse_filters(payload, socket) do
      {detours, total_count} = fetch_paginated_detours_and_total_count(socket, limit, offset, filters)
      total_pages = calculate_total_pages(total_count, limit)
      requested_page_number = div(offset, limit) + 1

      {:reply,
       {:ok,
        %{
          data: detours,
          total_count: total_count,
          total_pages: total_pages,
          page_number: min(requested_page_number, total_pages),
          page_size: limit
        }}, socket}
    else
      _ ->
        {:reply, {:error, %{reason: :invalid_pagination}}, socket}
    end
  end

  def handle_in_authenticated("paginate", _payload, socket) do
    {:reply, {:error, %{reason: :invalid_pagination}}, socket}
  end

  defp parse_integer(value) do
    case value do
      integer when is_integer(value) ->
        {:ok, integer}

      string when is_binary(value) ->
        case Integer.parse(string) do
          {parsed, _} -> {:ok, parsed}
          _ -> :error
        end

      _ ->
        :error
    end
  end

  defp validate_pagination(limit, offset) when is_integer(limit) and is_integer(offset) do
    if limit > 0 and offset >= 0 do
      :ok
    else
      :error
    end
  end

  defp calculate_total_pages(total_count, page_size)
       when is_integer(total_count) and is_integer(page_size) and page_size > 0 do
    max(1, div(total_count + page_size - 1, page_size))
  end

  defp fetch_paginated_detours_and_total_count(socket, limit, offset, filters) do
    case pagination_scope(socket) do
      {:user, user_id, status} ->
        {Detours.detours_for_user(user_id, status, limit, offset, filters),
         Detours.count_detours_for_user(user_id, status, filters)}

      {:route, route_id, status} ->
        {Detours.detours_for_route(route_id, status, limit, offset, filters),
         Detours.count_detours_for_route(route_id, status, filters)}

      :unknown ->
        {[], 0}
    end
  end

  defp parse_filters(payload, socket) do
    case pagination_scope(socket) do
      {:user, _user_id, :past} ->
        build_filters(payload)

      {:route, _route_id, :past} ->
        build_filters(payload)

      _ ->
        {:ok, %{}}
    end
  end

  defp build_filters(payload) do
    with {:ok, intersection} <- parse_optional_string(Map.get(payload, "intersection")),
         {:ok, reason} <- parse_optional_string(Map.get(payload, "reason")),
         {:ok, updated_at} <- parse_updated_at_dates(Map.get(payload, "updated_at")) do
      {:ok, %{intersection: intersection, reason: reason, updated_at: updated_at}}
    end
  end

  defp parse_optional_string(nil), do: {:ok, nil}
  defp parse_optional_string(value) when is_binary(value), do: {:ok, value}
  defp parse_optional_string(_value), do: :error

  defp parse_updated_at_dates(nil), do: {:ok, nil}
  defp parse_updated_at_dates([]), do: {:ok, []}

  defp parse_updated_at_dates(values) when is_list(values) do
    values
    |> Enum.reduce_while({:ok, []}, fn value, {:ok, acc} ->
      case value do
        date_string when is_binary(date_string) ->
          case Date.from_iso8601(date_string) do
            {:ok, date} -> {:cont, {:ok, [date | acc]}}
            _ -> {:halt, :error}
          end

        _ ->
          {:halt, :error}
      end
    end)
    |> case do
      {:ok, dates} -> {:ok, Enum.reverse(dates)}
      :error -> :error
    end
  end

  defp parse_updated_at_dates(_values), do: :error

  defp pagination_scope(%{topic: "detours:active"} = socket) do
    {:user, current_user_id(socket), :active}
  end

  defp pagination_scope(%{topic: "detours:active:" <> route_id}) do
    {:route, route_id, :active}
  end

  defp pagination_scope(%{topic: "detours:past"}) do
    {:route, "all", :past}
  end

  defp pagination_scope(%{topic: "detours:past:" <> route_id}) do
    {:route, route_id, :past}
  end

  defp pagination_scope(%{topic: "detours:draft:" <> _author_uuid} = socket) do
    {:user, current_user_id(socket), :draft}
  end

  defp pagination_scope(_socket), do: :unknown

  defp current_user_id(socket) do
    %{id: user_id} = Guardian.Phoenix.Socket.current_resource(socket)
    user_id
  end

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
