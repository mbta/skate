defmodule Skate.Settings.RouteTabTest do
  use Skate.DataCase
  alias Skate.Settings.RouteTab
  alias Skate.Settings.Db.RouteTab, as: DbRouteTab
  alias Skate.Settings.Db.User, as: DbUser

  describe "create/1" do
    test "creates and returns new record" do
      route_tab = RouteTab.create("charlie")

      assert %RouteTab{
               preset_name: nil,
               ladder_crowding_toggles: %{},
               ladder_directions: %{},
               selected_route_ids: []
             } = route_tab

      n_route_tabs = Skate.Repo.aggregate(DbRouteTab, :count)
      assert n_route_tabs == 1
      [sole_record] = Skate.Repo.all(DbRouteTab)

      assert %{
               preset_name: nil,
               ladder_crowding_toggles: %{},
               ladder_directions: %{},
               selected_route_ids: []
             } = sole_record

      [sole_user] = Skate.Repo.all(DbUser)
      assert %{username: "charlie"} = sole_user
      assert sole_user.id == sole_record.user_id
    end
  end

  describe "get_all_for_user/1" do
    test "retrieves route tabs by username" do
      RouteTab.create("user1")
      RouteTab.create("user2")

      assert [%RouteTab{}] = RouteTab.get_all_for_user("user1")
    end
  end

  describe "set/2" do
    test "updates existing route_tab" do
      route_tab = RouteTab.create("charlie")

      new_route_tab = RouteTab.set(route_tab, %{selected_route_ids: ["1"]})

      assert %{selected_route_ids: ["1"]} = new_route_tab
    end
  end
end
