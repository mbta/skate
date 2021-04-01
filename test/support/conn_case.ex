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
  import Test.Support.Helpers
  import Plug.Test

  using do
    quote do
      # Import conveniences for testing with connections
      use Phoenix.ConnTest
      alias SkateWeb.Router.Helpers, as: Routes

      # The default endpoint for testing
      @endpoint SkateWeb.Endpoint
    end
  end

  setup tags do
    reassign_env(
      :skate,
      :refresh_token_store,
      SkateWeb.ConnCase.FakeRefreshTokenStore
    )

    {conn, user} =
      cond do
        tags[:authenticated] ->
          user = "test_user"

          conn =
            Phoenix.ConnTest.build_conn()
            |> init_test_session(%{})
            |> Guardian.Plug.sign_in(SkateWeb.AuthManager, user, %{})

          {conn, user}

        tags[:authenticated_admin] ->
          user = "test_user"

          conn =
            Phoenix.ConnTest.build_conn()
            |> init_test_session(%{})
            |> Guardian.Plug.sign_in(SkateWeb.AuthManager, user, %{"groups" => ["skate-admin"]})

          {conn, user}

        true ->
          {Phoenix.ConnTest.build_conn(), nil}
      end

    {:ok, %{conn: conn, user: user}}
  end

  defmodule FakeRefreshTokenStore do
    def get_refresh_token(_), do: nil
  end
end
