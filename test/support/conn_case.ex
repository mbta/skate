defmodule SkateWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  it cannot be async. For this reason, every test runs
  inside a transaction which is reset at the beginning
  of the test unless the test case is marked as async.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      alias SkateWeb.Router.Helpers, as: Routes

      # The default endpoint for testing
      @endpoint SkateWeb.Endpoint

      use SkateWeb, :verified_routes
    end
  end

  setup tags do
    alias Ecto.Adapters.SQL.Sandbox

    :ok = Sandbox.checkout(Skate.Repo)

    unless tags[:async] do
      Sandbox.mode(Skate.Repo, {:shared, self()})
    end

    setup_from_tags(tags)
  end

  def setup_from_tags(%{authenticated: true}) do
    user = create_default_user()

    conn =
      Phoenix.ConnTest.build_conn()
      |> Phoenix.ConnTest.init_test_session(%{})
      |> Guardian.Plug.sign_in(SkateWeb.AuthManager, resource_from_user(user), %{})

    {:ok, %{conn: conn, user: user}}
  end

  def setup_from_tags(%{authenticated_admin: true}) do
    user = create_default_user()

    conn =
      Phoenix.ConnTest.build_conn()
      |> Phoenix.ConnTest.init_test_session(%{})
      |> Guardian.Plug.sign_in(SkateWeb.AuthManager, resource_from_user(user), %{
        "groups" => ["skate-admin"]
      })

    {:ok, %{conn: conn, user: user}}
  end

  def setup_from_tags(%{authenticated_dispatcher: true}) do
    user = create_default_user()

    conn =
      Phoenix.ConnTest.build_conn()
      |> Phoenix.ConnTest.init_test_session(%{})
      |> Guardian.Plug.sign_in(SkateWeb.AuthManager, resource_from_user(user), %{
        "groups" => ["skate-dispatcher"]
      })

    {:ok, %{conn: conn, user: user}}
  end

  def setup_from_tags(_) do
    {:ok, %{conn: Phoenix.ConnTest.build_conn(), user: nil}}
  end

  # Factory to create users
  # Currently uses hardcoded information, but is subject to change
  defp create_default_user() do
    username = "test_user"
    email = "test_user@test.com"

    Skate.Settings.User.upsert(username, email)
  end

  # Creates a Guardian resource for a `User`
  defp resource_from_user(%Skate.Settings.Db.User{id: id}) do
    %{id: id}
  end
end
