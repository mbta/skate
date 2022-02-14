defmodule Skate.Settings.RouteSettingsMigratorTest do
  use Skate.DataCase
  import Skate.Factory
  import ExUnit.CaptureLog
  import Ecto.Query
  import Test.Support.Helpers

  alias Skate.Settings.RouteSettings
  alias Skate.Settings.RouteTab
  alias Skate.Settings.Db.RouteSettings, as: DbRouteSettings
  alias Skate.Settings.Db.RouteTab, as: DbRouteTab

  describe "init/1" do
    test "passes through direction option" do
      assert {:ok, nil, {:continue, :route_tabs_to_route_settings}} =
               Skate.Settings.RouteSettingsMigrator.init(direction: :route_tabs_to_route_settings)
    end
  end

  describe "start_link/1" do
    test "starts GenServer" do
      assert {:ok, _pid} = Skate.Settings.RouteSettingsMigrator.start_link()
    end
  end

  describe "handle_continue/2" do
    test "migrates from route_settings to route_tabs" do
      set_log_level(:info)

      _user = RouteSettings.get_or_create("charlie")

      :ok =
        RouteSettings.set("charlie", [
          {:selected_route_ids, ["1", "77"]},
          {:ladder_directions, %{"77" => 1}},
          {:ladder_crowding_toggles, %{"1" => true}}
        ])

      log =
        capture_log([level: :info], fn ->
          {:stop, :normal, nil} =
            Skate.Settings.RouteSettingsMigrator.handle_continue(
              :route_settings_to_route_tabs,
              nil
            )
        end)

      assert [
               %{
                 selected_route_ids: ["1", "77"],
                 ladder_directions: %{"77" => 1},
                 ladder_crowding_toggles: %{"1" => true}
               }
             ] = RouteTab.get_all_for_user("charlie")

      assert log =~ "migrated 1 user(s) from route_settings to route_tabs"
    end

    test "doesn't migrate for users who have route_tabs more recent than route_settings" do
      _user = RouteSettings.get_or_create("charlie")
      :ok = RouteSettings.set("charlie", [{:selected_route_ids, ["1", "77"]}])

      from(rs in DbRouteSettings)
      |> Repo.update_all(set: [updated_at: DateTime.utc_now() |> DateTime.add(-60, :second)])

      _route_tabs =
        RouteTab.update_all_for_user!("charlie", [
          build(:route_tab, %{selected_route_ids: ["28", "39"]})
        ])

      {:stop, :normal, nil} =
        Skate.Settings.RouteSettingsMigrator.handle_continue(:route_settings_to_route_tabs, nil)

      assert [%{selected_route_ids: ["28", "39"]}] = RouteTab.get_all_for_user("charlie")
    end

    test "migrates from route_tabs to route_settings" do
      set_log_level(:info)

      _user = RouteSettings.get_or_create("charlie")

      _route_tabs =
        RouteTab.update_all_for_user!("charlie", [
          build(:route_tab, %{
            ordering: 0,
            selected_route_ids: ["1", "22"],
            ladder_directions: %{"22" => 1},
            ladder_crowding_toggles: %{"22" => true}
          }),
          build(:route_tab, %{
            ordering: 1,
            selected_route_ids: ["22", "66"],
            ladder_directions: %{"22" => 0},
            ladder_crowding_toggles: %{"22" => false}
          }),
          build(:route_tab, %{
            ordering: nil,
            selected_route_ids: ["71", "73"]
          })
        ])

      log =
        capture_log([level: :info], fn ->
          {:stop, :normal, nil} =
            Skate.Settings.RouteSettingsMigrator.handle_continue(
              :route_tabs_to_route_settings,
              nil
            )
        end)

      assert %RouteSettings{
               selected_route_ids: ["1", "22", "66"],
               ladder_directions: %{"22" => 0},
               ladder_crowding_toggles: %{"22" => false}
             } = RouteSettings.get_or_create("charlie")

      assert log =~ "migrated 1 user(s) from route_tabs to route_settings"
    end

    test "doesn't migrate for users who have route_settings more recent than route_tabs" do
      _user = RouteSettings.get_or_create("charlie")
      :ok = RouteSettings.set("charlie", [{:selected_route_ids, ["1", "77"]}])

      _route_tabs =
        RouteTab.update_all_for_user!("charlie", [
          build(:route_tab, %{
            ordering: 0,
            selected_route_ids: ["22", "66"],
            ladder_directions: %{"22" => 0},
            ladder_crowding_toggles: %{"22" => false}
          })
        ])

      from(rt in DbRouteTab)
      |> Repo.update_all(set: [updated_at: DateTime.utc_now() |> DateTime.add(-60, :second)])

      {:stop, :normal, nil} =
        Skate.Settings.RouteSettingsMigrator.handle_continue(:route_tabs_to_route_settings, nil)

      assert %RouteSettings{
               selected_route_ids: ["1", "77"],
               ladder_directions: %{},
               ladder_crowding_toggles: %{}
             } = RouteSettings.get_or_create("charlie")
    end

    test "logs error when unrecognized direction is provided" do
      log =
        capture_log([level: :error], fn ->
          assert {:stop, :invalid_direction, nil} =
                   Skate.Settings.RouteSettingsMigrator.handle_continue(:foo, nil)
        end)

      assert log =~ "Skate.Settings.RouteSettingsMigrator invalid direction for migration: :foo"
    end
  end
end
