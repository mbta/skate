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
    raw_detours =
      Detours.list_detours()

    detours =
      Enum.map(raw_detours, fn detour ->
        case Detours.db_detour_to_detour(detour) do
          nil ->
            nil

          map ->
            Map.put(
              map,
              :author_email,
              detour.author.email
            )
        end
      end)

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
