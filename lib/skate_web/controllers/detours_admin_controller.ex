defmodule SkateWeb.DetoursAdminController do
  @moduledoc """
  Provides a list of detours in Skate's system and a button to clear them all
  """

  alias Skate.Detours.Detours
  alias Skate.Settings.User
  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    detours =
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

    conn
    |> assign(:detour, Detours.db_detour_to_detour(detour))
    |> assign(:author, author)
    |> assign(:detour_diff, detour_diff)
    |> assign(:matches, matches)
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
end
