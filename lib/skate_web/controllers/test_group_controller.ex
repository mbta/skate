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
    test_groups = TestGroup.get_all() |> Enum.sort_by(& &1.name)

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
      test_group_user_emails =
        test_group.users
        |> Enum.map(&String.downcase(&1.email))
        |> Enum.filter(&(!is_nil(&1)))
        |> Enum.sort()

      conn
      |> assign(:test_group_name, test_group.name)
      |> assign(:test_group_id, test_group.id)
      |> assign(:test_group_users, test_group_user_emails)
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

      users =
        all_users
        |> Enum.filter(&(!is_nil(&1.email) and &1.id not in user_ids_already_in_group))
        |> Enum.sort_by(&String.downcase(&1.email))

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
