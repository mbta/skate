defmodule SkateWeb.DetoursAdminController do
  @moduledoc """
  Provides a list of detours in Skate's system and a button to clear them all
  """

  alias Skate.Detours.Detours
  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    raw_detours =
      Detours.list_detours()

    detours =
      Enum.map(raw_detours, fn detour ->
        case Detours.db_detour_to_detour(detour, nil) do
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

  @spec delete_all(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_all(conn, _params) do
    Detours.delete_all_detours()
    redirect(conn, to: ~p"/detours_admin")
  end
end
