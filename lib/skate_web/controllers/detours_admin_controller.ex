defmodule SkateWeb.DetoursAdminController do
  @moduledoc """
  Provides a list of detours in Skate's system and a button to clear them all
  """

  alias Skate.Detours.Detours
  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    detours =
      [
        # Route column
        :route_name,
        :direction,
        :headsign,

        # Intersection column
        :nearest_intersection,

        # Updated At column
        :updated_at,

        # Status column; Required for categorizing the detour
        :state_value,

        # For some reason, without the id explicitly present, we're not able to preload the association
        :author_id,
        author: [:email]
      ]
      |> Detours.list_detours()
      |> Enum.map(fn detour ->
        %{detour | status: Skate.Detours.Detours.categorize_detour(detour)}
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
