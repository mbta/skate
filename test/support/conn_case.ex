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
  import Plug.Test
  alias Skate.Settings.User

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
    username = "test_user"
    email = "test_user@test.com"

    unless tags[:async] do
      Sandbox.mode(Skate.Repo, {:shared, self()})
    end

    user = User.upsert(username, email)
    resource = %{id: user.id}

    {conn, user} =
      cond do
        tags[:authenticated] ->
          User.upsert(username, email)

          conn =
            Phoenix.ConnTest.build_conn()
            |> init_test_session(%{})
            |> Guardian.Plug.sign_in(SkateWeb.AuthManager, resource, %{})

          {conn, user}

        tags[:authenticated_admin] ->
          User.upsert(username, email)

          conn =
            Phoenix.ConnTest.build_conn()
            |> init_test_session(%{})
            |> Guardian.Plug.sign_in(SkateWeb.AuthManager, resource, %{
              "groups" => ["skate-admin"]
            })

          {conn, user}

        tags[:authenticated_dispatcher] ->
          User.upsert(username, email)

          conn =
            Phoenix.ConnTest.build_conn()
            |> init_test_session(%{})
            |> Guardian.Plug.sign_in(SkateWeb.AuthManager, resource, %{
              "groups" => ["skate-dispatcher"]
            })

          {conn, user}

        true ->
          {Phoenix.ConnTest.build_conn(), nil}
      end

    {:ok, %{conn: conn, user: user}}
  end
end
