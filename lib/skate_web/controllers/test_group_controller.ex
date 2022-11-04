defmodule SkateWeb.TestGroupController do
  @moduledoc """
  Provides an interface to view, create, and delete test groups, as well as add
  and remove users from test groups.
  """

  use SkateWeb, :controller

  alias Skate.Settings.TestGroup
  alias Skate.Settings.User

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    test_groups = TestGroup.get_all()

    conn
    |> assign(:test_groups, test_groups)
    |> put_layout({SkateWeb.LayoutView, "test_groups.html"})
    |> render("index.html")
  end

  @spec post(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def post(conn, params) do
    TestGroup.create(params["name"])

    redirect(conn, to: SkateWeb.Router.Helpers.test_group_path(conn, :index))
  end

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, params) do
    test_group = TestGroup.get(params["id"])

    if test_group do
      conn
      |> assign(:test_group_name, test_group.name)
      |> assign(:test_group_id, test_group.id)
      |> assign(:test_group_users, Enum.map(test_group.users, & &1.email))
      |> put_layout({SkateWeb.LayoutView, "test_groups.html"})
      |> render("test_group.html")
    else
      send_resp(conn, :not_found, "no test group found")
    end
  end

  @spec add_user_form(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def add_user_form(conn, params) do
    test_group = TestGroup.get(params["id"])

    if test_group do
      all_users = User.get_all()
      user_ids_already_in_group = test_group.users |> Enum.map(& &1.id) |> MapSet.new()

      users = Enum.filter(all_users, &(&1.id not in user_ids_already_in_group))

      conn
      |> assign(:test_group_name, test_group.name)
      |> assign(:test_group_id, test_group.id)
      |> assign(:users, users)
      |> put_layout({SkateWeb.LayoutView, "test_groups.html"})
      |> render("add_user.html")
    else
      send_resp(conn, :not_found, "no test group found")
    end
  end

  @spec add_user(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def add_user(conn, params) do
    test_group = TestGroup.get(params["id"])
    user = User.get_by_id(params["user_id"])

    cond do
      is_nil(test_group) ->
        send_resp(conn, :not_found, "no test group found")

      is_nil(user) ->
        send_resp(conn, :bad_request, "no user found")

      true ->
        TestGroup.update(%TestGroup{test_group | users: [user | test_group.users]})
        redirect(conn, to: SkateWeb.Router.Helpers.test_group_path(conn, :show, test_group.id))
    end
  end
end
