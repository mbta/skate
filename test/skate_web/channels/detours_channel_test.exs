defmodule SkateWeb.DetoursChannelTest do
  use SkateWeb.ConnCase

  import Phoenix.ChannelTest

  import Test.Support.Helpers
  import Skate.Factory

  alias Phoenix.Socket
  alias SkateWeb.{UserSocket, DetoursChannel}

  setup %{conn: conn} do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)

    %{id: authenticated_user_id} = SkateWeb.AuthManager.Plug.current_resource(conn)

    socket =
      UserSocket
      |> socket("", %{})
      |> Guardian.Phoenix.Socket.put_current_resource(%{id: authenticated_user_id})

    start_supervised({Phoenix.PubSub, name: Skate.PubSub})

    {:ok, %{conn: conn, socket: socket}}
  end

  describe "join/3" do
    @tag :authenticated
    test "subscribes to all active detours with initial detours", %{socket: socket} do
      :detour |> build() |> with_id(1) |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(2)
      |> with_route(%{name: "57", id: "57"})
      |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(3)
      |> with_route(%{name: "66", id: "66"})
      |> insert()

      :detour |> build() |> deactivated |> with_id(4) |> insert()

      assert {:ok,
              %{
                data: [
                  %Skate.Detours.Detour.ActivatedDetourDetails{
                    details: %Skate.Detours.Detour.Detailed{
                      author_id: _,
                      direction: _,
                      id: 2,
                      intersection: "detour_nearest_intersection:" <> _,
                      name: "detour_route_pattern_headsign:" <> _,
                      route: "57",
                      status: :active,
                      updated_at: _
                    }
                  },
                  %Skate.Detours.Detour.ActivatedDetourDetails{
                    details: %Skate.Detours.Detour.Detailed{
                      author_id: _,
                      direction: _,
                      id: 3,
                      intersection: "detour_nearest_intersection:" <> _,
                      name: "detour_route_pattern_headsign:" <> _,
                      route: "66",
                      status: :active,
                      updated_at: _
                    }
                  }
                ]
              },
              %Socket{}} =
               subscribe_and_join(socket, DetoursChannel, "detours:active")
    end

    @tag :authenticated
    test "subscribes to active detours for one route", %{socket: socket} do
      :detour |> build() |> with_id(1) |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(2)
      |> with_route(%{name: "57", id: "57"})
      |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(3)
      |> with_route(%{name: "66", id: "66"})
      |> insert()

      :detour |> build() |> deactivated |> with_id(4) |> insert()

      assert {:ok,
              %{
                data: [
                  %Skate.Detours.Detour.ActivatedDetourDetails{
                    details: %Skate.Detours.Detour.Detailed{
                      author_id: _,
                      direction: _,
                      id: 3,
                      intersection: "detour_nearest_intersection:" <> _,
                      name: "detour_route_pattern_headsign:" <> _,
                      route: "66",
                      status: :active,
                      updated_at: _
                    }
                  }
                ]
              },
              %Socket{}} =
               subscribe_and_join(socket, DetoursChannel, "detours:active:66")
    end

    @tag :authenticated
    test "subscribes to active detours for SL1", %{socket: socket} do
      :detour |> build() |> with_id(1) |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(2)
      |> with_route(%{name: "SL1", id: "741"})
      |> insert()

      :detour |> build() |> deactivated |> with_id(3) |> insert()

      assert {:ok,
              %{
                data: [
                  %Skate.Detours.Detour.ActivatedDetourDetails{
                    details: %Skate.Detours.Detour.Detailed{
                      author_id: _,
                      direction: _,
                      id: 2,
                      intersection: "detour_nearest_intersection:" <> _,
                      name: "detour_route_pattern_headsign:" <> _,
                      route: "SL1",
                      status: :active,
                      updated_at: _
                    }
                  }
                ]
              },
              %Socket{}} =
               subscribe_and_join(socket, DetoursChannel, "detours:active:741")
    end

    @tag :authenticated
    test "subscribes to draft detours with initial detours", %{
      conn: conn,
      socket: socket,
      user: user
    } do
      %{id: authenticated_user_id} = SkateWeb.AuthManager.Plug.current_resource(conn)

      :detour |> build() |> with_id(1) |> insert()
      :detour |> build() |> with_id(2) |> insert()
      :detour |> build() |> with_id(3) |> insert()
      :detour |> build(author: user) |> with_id(4) |> insert()

      assert {:ok,
              %{
                data: [
                  %Skate.Detours.Detour.Detailed{
                    author_id: ^authenticated_user_id,
                    direction: _,
                    id: 4,
                    intersection: "detour_nearest_intersection:" <> _,
                    name: "detour_route_pattern_headsign:" <> _,
                    route: "detour_route_name:" <> _,
                    status: :draft,
                    updated_at: _
                  }
                ]
              },
              %Socket{}} =
               subscribe_and_join(
                 socket,
                 DetoursChannel,
                 "detours:draft:" <> Integer.to_string(authenticated_user_id)
               )
    end

    @tag :authenticated
    test "subscribes to past detours with initial detours", %{socket: socket} do
      :detour |> build() |> with_id(1) |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(2)
      |> with_route(%{name: "57", id: "57"})
      |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(3)
      |> with_route(%{name: "66", id: "66"})
      |> insert()

      :detour |> build() |> deactivated |> with_id(4) |> insert()

      assert {:ok,
              %{
                data: [
                  %Skate.Detours.Detour.Detailed{
                    author_id: _,
                    direction: _,
                    id: 4,
                    intersection: "detour_nearest_intersection:" <> _,
                    name: "detour_route_pattern_headsign:" <> _,
                    route: "detour_route_name:" <> _,
                    status: :past,
                    updated_at: _
                  }
                ]
              },
              %Socket{}} =
               subscribe_and_join(socket, DetoursChannel, "detours:past")
    end

    @tag :authenticated
    test "deny topic subscription when socket token validation fails", %{socket: socket} do
      :detour |> build() |> with_id(1) |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(2)
      |> with_route(%{name: "57", id: "57"})
      |> insert()

      :detour
      |> build()
      |> activated
      |> with_id(3)
      |> with_route(%{name: "66", id: "66"})
      |> insert()

      :detour |> build() |> deactivated |> with_id(4) |> insert()

      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      for route <- [
            "detours:active",
            "random:topic:"
          ],
          do:
            assert(
              {:error, %{reason: :not_authenticated}} =
                subscribe_and_join(socket, DetoursChannel, route)
            )
    end
  end

  describe "handle_info/2" do
    @tag :authenticated
    test "pushes newly drafted detour onto the draft detour socket", %{conn: conn, socket: socket} do
      %{id: user_id} = SkateWeb.AuthManager.Plug.current_resource(conn)

      {:ok, _, socket} =
        subscribe_and_join(socket, DetoursChannel, "detours:draft:" <> Integer.to_string(user_id))

      detour = build(:detour_snapshot)

      assert {:noreply, _socket} =
               DetoursChannel.handle_info(
                 {:detour_drafted, detour},
                 socket
               )

      assert_push("drafted", %{data: ^detour})
    end

    @tag :authenticated
    test "pushes newly activated detour onto the active detour socket", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, DetoursChannel, "detours:active")

      detour =
        :detour |> build() |> activated |> insert() |> Skate.Detours.Detours.db_detour_to_detour()

      assert {:noreply, _socket} =
               DetoursChannel.handle_info(
                 {:detour_activated, detour},
                 socket
               )

      assert_push("activated", %{data: ^detour})
    end

    @tag :authenticated
    test "pushes newly activated detour onto the draft detour socket", %{
      conn: conn,
      socket: socket
    } do
      %{id: user_id} = SkateWeb.AuthManager.Plug.current_resource(conn)

      {:ok, _, socket} =
        subscribe_and_join(socket, DetoursChannel, "detours:draft:" <> Integer.to_string(user_id))

      detour =
        :detour |> build() |> activated |> insert() |> Skate.Detours.Detours.db_detour_to_detour()

      assert {:noreply, _socket} =
               DetoursChannel.handle_info(
                 {:detour_activated, detour},
                 socket
               )

      assert_push("activated", %{data: ^detour})
    end

    @tag :authenticated
    test "rejects sending activated detour when socket is not authenticated", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, DetoursChannel, "detours:active")

      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      detour = :detour_snapshot |> build() |> activated

      assert {:stop, :normal, _socket} =
               DetoursChannel.handle_info(
                 {:detour_activated, detour},
                 socket
               )

      assert_push("auth_expired", _)
    end

    @tag :authenticated
    test "pushes newly deactivated detour onto the active detour socket", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, DetoursChannel, "detours:active")

      detour = :detour_snapshot |> build() |> deactivated

      assert {:noreply, _socket} =
               DetoursChannel.handle_info(
                 {:detour_deactivated, detour},
                 socket
               )

      assert_push("deactivated", %{data: ^detour})
    end

    @tag :authenticated
    test "pushes newly deactivated detour onto the past detour socket", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, DetoursChannel, "detours:past")

      detour = :detour_snapshot |> build() |> deactivated

      assert {:noreply, _socket} =
               DetoursChannel.handle_info(
                 {:detour_deactivated, detour},
                 socket
               )

      assert_push("deactivated", %{data: ^detour})
    end

    @tag :authenticated
    test "rejects sending deactivated detour when socket is not authenticated", %{socket: socket} do
      {:ok, _, socket} = subscribe_and_join(socket, DetoursChannel, "detours:past")

      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      detour = :detour_snapshot |> build() |> deactivated

      assert {:stop, :normal, _socket} =
               DetoursChannel.handle_info(
                 {:detour_deactivated, detour},
                 socket
               )

      assert_push("auth_expired", _)
    end

    @tag :authenticated
    test "pushes deleted detour onto the draft detour socket", %{
      conn: conn,
      socket: socket
    } do
      %{id: user_id} = SkateWeb.AuthManager.Plug.current_resource(conn)

      {:ok, _, socket} =
        subscribe_and_join(socket, DetoursChannel, "detours:draft:" <> Integer.to_string(user_id))

      detour = insert(:detour, author: build(:user))
      Skate.Detours.Detours.delete_draft_detour(detour, user_id)

      detour_id = detour.id

      assert {:noreply, _socket} =
               DetoursChannel.handle_info(
                 {:draft_detour_deleted, detour_id},
                 socket
               )

      assert_push("deleted", %{data: ^detour_id})
    end

    @tag :authenticated
    test "rejects sending deleted detour when socket not authenticated", %{
      conn: conn,
      socket: socket
    } do
      %{id: user_id} = SkateWeb.AuthManager.Plug.current_resource(conn)

      {:ok, _, socket} =
        subscribe_and_join(socket, DetoursChannel, "detours:draft:" <> Integer.to_string(user_id))

      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      detour = insert(:detour, author: build(:user))
      Skate.Detours.Detours.delete_draft_detour(detour, user_id)

      detour_id = detour.id

      assert {:stop, :normal, _socket} =
               DetoursChannel.handle_info(
                 {:draft_detour_deleted, detour_id},
                 socket
               )

      assert_push("auth_expired", _)
    end
  end
end
