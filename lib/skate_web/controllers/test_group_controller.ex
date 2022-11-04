defmodule SkateWeb.TestGroupController do
  @moduledoc """
  Provides an interface to view, create, and delete test groups, as well as add
  and remove users from test groups.
  """

  use SkateWeb, :controller

  alias Skate.Settings.TestGroup

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    test_groups = TestGroup.get_all()

    conn
    |> assign(:test_groups, test_groups)
    |> put_layout({SkateWeb.LayoutView, "test_groups.html"})
    |> render("index.html")
  end
end
