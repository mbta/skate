defmodule SkateWeb.DetoursAdminController do
  @moduledoc """
  Provides a list of detours in Skate's system and a button to clear them all
  """

  alias Skate.Detours.Detours
  alias Skate.Settings.User
  use SkateWeb, :controller
  require Logger

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    detours = get_detours()

    conn
    |> assign(:detours, detours)
    |> render(:index,
      layout: {SkateWeb.Layouts, "barebones.html"},
      title: "Skate Detours"
    )
  end

  def show(conn, %{"id" => id}) do
    detour = Detours.get_detour!(id)
    author = User.get_by_id(detour.author_id)
    {matches, detour_diff} = Skate.Detours.SnapshotSerde.compare_snapshots(detour)
    swiftly_adjustment = Detours.get_swiftly_adjustment_for_detour(id)

    conn
    |> assign(:detour, Detours.db_detour_to_detour(detour))
    |> assign(:author, author)
    |> assign(:detour_diff, detour_diff)
    |> assign(:matches, matches)
    |> assign(:swiftly_adjustment, swiftly_adjustment)
    |> render(:show,
      layout: {SkateWeb.Layouts, "barebones.html"},
      title: "Skate Detours"
    )
  end

  @spec delete_all(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_all(conn, _params) do
    Detours.delete_all_detours()
    redirect(conn, to: ~p"/detours_admin")
  end

  @spec sync_swiftly(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def sync_swiftly(conn, _params) do
    Logger.info("begin manual sync detours with swiftly")
    Detours.sync_swiftly_with_skate()
    Logger.info("end manual sync detours with swiftly")
    redirect(conn, to: ~p"/detours_admin")
  end

  @spec manual_add_swiftly(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def manual_add_swiftly(conn, %{"id" => id}) do
    Logger.info("begin sync detour with swiftly for detour detour_id=#{inspect(id)}")
    Detours.create_in_swiftly(id)
    Logger.info("end manual add detour with swiftly for detour detour_id=#{inspect(id)}")
    redirect(conn, to: ~p"/detours_admin/#{id}")
  end

  @spec manual_remove_swiftly(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def manual_remove_swiftly(conn, %{"id" => id}) do
    Logger.info("begin sync detour with swiftly for detour detour_id=#{inspect(id)}")
    Detours.delete_in_swiftly(id)
    Logger.info("end sync detour with swiftly for detour detour_id=#{inspect(id)}")
    redirect(conn, to: ~p"/detours_admin/#{id}")
  end

  @spec swiftly_service_adjustments(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def swiftly_service_adjustments(conn, _) do
    swiftly_adjustments = Detours.get_swiftly_adjustments()

    detours_map =
      Map.new(get_detours(), fn detour ->
        {Integer.to_string(detour.id), detour}
      end)

    conn
    |> assign(:detours_map, detours_map)
    |> assign(:swiftly_adjustments, swiftly_adjustments)
    |> render(:swiftly_adjustments,
      layout: {SkateWeb.Layouts, "barebones.html"},
      title: "Swiftly Service Adjustments"
    )
  end

  defp get_detours() do
    Detours.list_detours([
      :id,

      # Route column
      :route_name,
      :direction,
      :headsign,

      # Intersection column
      :nearest_intersection,

      # Updated At column
      :updated_at,

      # Detour Status Column
      :status,

      # For some reason, without the primary keys explicitly present in the
      # query, we're not able to preload the association. So we need the
      # `User.id` and `Detour.id` explicitly in the query.
      author: [
        :email,
        :id
      ]
    ])
  end
end
