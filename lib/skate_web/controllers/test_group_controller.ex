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
    test_groups = Enum.sort_by(TestGroup.get_all(), & &1.name)

    conn
    |> assign(:test_groups, test_groups)
    |> assign(:changeset, Skate.Settings.Db.TestGroup.changeset(%Skate.Settings.Db.TestGroup{}))
    |> put_layout()
    |> render(:index)
  end

  @spec post(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def post(conn, params) do
    case TestGroup.create(params["test_group"]["name"]) do
      {:ok, _} ->
        redirect(conn, to: ~p"/test_groups")

      {:error, changeset} ->
        test_groups = Enum.sort_by(TestGroup.get_all(), & &1.name)

        conn
        |> assign(:test_groups, test_groups)
        |> assign(:changeset, changeset)
        |> put_layout()
        |> put_status(:bad_request)
        |> render(:index)
    end
  end

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, params) do
    test_group = TestGroup.get(params["id"])

    if test_group do
      test_group_users =
        test_group.users
        |> Enum.map(&{&1.id, &1.email})
        |> Enum.filter(fn {_id, email} -> !is_nil(email) end)
        |> Enum.sort_by(fn {_id, email} -> email end)

      conn
      |> assign(:test_group_name, test_group.name)
      |> assign(:test_group_id, test_group.id)
      |> assign(:test_group_users, test_group_users)
      |> assign(:test_group_override, test_group.override)
      |> put_layout()
      |> render(:test_group)
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
        |> Enum.sort_by(& &1.email)

      conn
      |> assign(:test_group_name, test_group.name)
      |> assign(:test_group_id, test_group.id)
      |> assign(:users, users)
      |> put_layout()
      |> render(:add_user)
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
        redirect(conn, to: ~p"/test_groups/#{test_group.id}")
    end
  end

  @spec remove_user(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def remove_user(conn, params) do
    test_group = TestGroup.get(params["id"])

    if test_group do
      {new_users, user_found?} =
        Enum.reduce(test_group.users, {[], false}, fn user, {users, found?} ->
          if Integer.to_string(user.id) == params["user_id"] do
            {users, true}
          else
            {[user | users], found?}
          end
        end)

      if user_found? do
        TestGroup.update(%TestGroup{test_group | users: new_users})

        redirect(conn, to: ~p"/test_groups/#{test_group.id}")
      else
        send_resp(conn, :bad_request, "user not found in test group")
      end
    else
      send_resp(conn, :not_found, "no test group found")
    end
  end

  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => id}) do
    {id, _} = Integer.parse(id)
    TestGroup.delete(id)
    redirect(conn, to: ~p"/test_groups")
  end

  @spec enable_override(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def enable_override(conn, %{"id" => id}) do
    test_group = TestGroup.get(id)
    TestGroup.update(%{test_group | override: :enabled})
    redirect(conn, to: ~p"/test_groups/#{id}")
  end

  @spec remove_override(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def remove_override(conn, %{"id" => id}) do
    test_group = TestGroup.get(id)
    TestGroup.update(%{test_group | override: :none})
    redirect(conn, to: ~p"/test_groups/#{id}")
  end

  defp put_layout(conn) do
    conn
    |> put_layout(html: {SkateWeb.Layouts, :barebones})
    |> assign(:title, "Skate Test Groups")
  end
end
