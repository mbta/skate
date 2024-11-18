defmodule SkateWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  we enable the SQL sandbox, so changes done to the database
  are reverted at the end of every test. If you are using
  PostgreSQL, you can even run database tests asynchronously
  by setting `use SkateWeb.ConnCase, async: true`, although
  this option is not recommended for other databases.
  """

  use ExUnit.CaseTemplate
  import Plug.Test

  using do
    quote do
      # The default endpoint for testing
      @endpoint SkateWeb.Endpoint

      use SkateWeb, :verified_routes

      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      import SkateWeb.ConnCase
    end
  end

  setup tags do
    Skate.DataCase.setup_sandbox(tags)

    user = Skate.Factory.insert(:user)
    resource = %{id: user.id}

    {conn, user} =
      cond do
        tags[:authenticated] ->
          conn =
            Phoenix.ConnTest.build_conn()
            |> init_test_session(%{})
            |> Guardian.Plug.sign_in(SkateWeb.AuthManager, resource, %{})

          {conn, user}

        tags[:authenticated_admin] ->
          conn =
            Phoenix.ConnTest.build_conn()
            |> init_test_session(%{})
            |> Guardian.Plug.sign_in(SkateWeb.AuthManager, resource, %{
              "groups" => ["skate-admin"]
            })

          {conn, user}

        tags[:authenticated_dispatcher] ->
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
