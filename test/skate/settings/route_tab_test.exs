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
      route_tab1 = build_test_tab()
      route_tab2 = build_test_tab()

      RouteTab.update_all_for_user!("user1", [route_tab1])
      RouteTab.update_all_for_user!("user2", [route_tab2])

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

      assert [
               %RouteTab{
                 preset_name: "some routes",
                 selected_route_ids: ["1", "28"],
                 ladder_directions: %{"28" => "1"},
                 ladder_crowding_toggles: %{"1" => true}
               }
             ] = RouteTab.get_all_for_user("charlie")
    end

    test "updates an existing tab entry" do
      route_tab1 = build_test_tab()
      route_tab1_uuid = route_tab1.uuid
      route_tab2 = build_test_tab()
      route_tab2_uuid = route_tab2.uuid

      [persisted_route_tab1] = RouteTab.update_all_for_user!("charlie", [route_tab1])

      update_results =
        RouteTab.update_all_for_user!("charlie", [
          %{
            persisted_route_tab1
            | preset_name: "some other name",
              save_changes_to_tab_uuid: route_tab2_uuid
          },
          route_tab2
        ])

      assert Enum.count(update_results) == 2

      assert %RouteTab{
               uuid: ^route_tab1_uuid,
               preset_name: "some other name",
               selected_route_ids: ["1", "28"],
               ladder_directions: %{"28" => "1"},
               ladder_crowding_toggles: %{"1" => true},
               save_changes_to_tab_uuid: ^route_tab2_uuid
             } = Enum.find(update_results, fn route_tab -> route_tab.uuid == route_tab1_uuid end)

      assert %RouteTab{
               uuid: ^route_tab2_uuid
             } = Enum.find(update_results, fn route_tab -> route_tab.uuid == route_tab2_uuid end)

      get_all_results = RouteTab.get_all_for_user("charlie")

      assert Enum.count(get_all_results) == 2

      assert %RouteTab{
               uuid: ^route_tab1_uuid,
               preset_name: "some other name",
               selected_route_ids: ["1", "28"],
               ladder_directions: %{"28" => "1"},
               ladder_crowding_toggles: %{"1" => true},
               save_changes_to_tab_uuid: ^route_tab2_uuid
             } = Enum.find(get_all_results, fn route_tab -> route_tab.uuid == route_tab1_uuid end)

      assert %RouteTab{
               uuid: ^route_tab2_uuid
             } = Enum.find(get_all_results, fn route_tab -> route_tab.uuid == route_tab2_uuid end)
    end

    test "deletes a removed tab entry" do
      route_tab = build_test_tab()

      [_persisted_route_tab] = RouteTab.update_all_for_user!("charlie", [route_tab])

      RouteTab.update_all_for_user!("charlie", [])

      assert [] == RouteTab.get_all_for_user("charlie")
    end
  end
end
