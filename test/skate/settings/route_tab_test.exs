defmodule Skate.Settings.RouteTabTest do
  use Skate.DataCase
  import Skate.Factory
  alias Skate.Settings.RouteTab

  def build_test_tab() do
    build(:route_tab, %{
      preset_name: "some routes",
      selected_route_ids: ["1", "28"],
      ladder_directions: %{"28" => "1"},
      ladder_crowding_toggles: %{"1" => true}
    })
  end

  describe "get_all_for_user/1" do
    test "retrieves route tabs by username" do
      route_tab = build_test_tab()

      RouteTab.update_all_for_user!("user1", [route_tab])
      RouteTab.update_all_for_user!("user2", [route_tab])

      assert [
               %RouteTab{
                 preset_name: "some routes",
                 selected_route_ids: ["1", "28"],
                 ladder_directions: %{"28" => "1"},
                 ladder_crowding_toggles: %{"1" => true}
               }
             ] = RouteTab.get_all_for_user("user1")
    end
  end

  describe "update_all_for_user!/2" do
    test "adds a new tab entry" do
      route_tab = build_test_tab()

      assert [
               %RouteTab{
                 preset_name: "some routes",
                 selected_route_ids: ["1", "28"],
                 ladder_directions: %{"28" => "1"},
                 ladder_crowding_toggles: %{"1" => true}
               }
             ] = RouteTab.update_all_for_user!("charlie", [route_tab])

      [route_tab_from_db] = RouteTab.get_all_for_user("charlie")

      refute is_nil(route_tab_from_db.id)

      assert %RouteTab{
               preset_name: "some routes",
               selected_route_ids: ["1", "28"],
               ladder_directions: %{"28" => "1"},
               ladder_crowding_toggles: %{"1" => true}
             } = route_tab_from_db
    end

    test "updates an existing tab entry" do
      route_tab = build_test_tab()

      [persisted_route_tab] = RouteTab.update_all_for_user!("charlie", [route_tab])

      assert [
               %RouteTab{
                 preset_name: "some other name",
                 selected_route_ids: ["1", "28"],
                 ladder_directions: %{"28" => "1"},
                 ladder_crowding_toggles: %{"1" => true}
               }
             ] =
               RouteTab.update_all_for_user!("charlie", [
                 %{persisted_route_tab | preset_name: "some other name"}
               ])

      persisted_route_tab_id = persisted_route_tab.id

      assert [
               %RouteTab{
                 id: ^persisted_route_tab_id,
                 preset_name: "some other name",
                 selected_route_ids: ["1", "28"],
                 ladder_directions: %{"28" => "1"},
                 ladder_crowding_toggles: %{"1" => true}
               }
             ] = RouteTab.get_all_for_user("charlie")
    end

    test "deletes a removed tab entry" do
      route_tab = build_test_tab()

      [_persisted_route_tab] = RouteTab.update_all_for_user!("charlie", [route_tab])

      RouteTab.update_all_for_user!("charlie", [])

      assert [] == RouteTab.get_all_for_user("charlie")
    end
  end
end
