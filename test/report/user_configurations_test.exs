defmodule Report.UserConfigurationsTest do
  use Skate.DataCase

  import Skate.Repo

  alias Skate.Settings.Db.RouteTab, as: DbRouteTab
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings

  describe "run/0" do
    test "returns users with their settings & route tabs" do
      %{email: email, username: username, uuid: uuid} =
        user =
        insert!(
          DbUser.changeset(%DbUser{}, %{
            username: "username",
            email: "test@email.com",
            uuid: "12345"
          }),
          returning: true
        )

      tab_1 = %DbRouteTab{
        user_id: user.id,
        uuid: Ecto.UUID.generate(),
        selected_route_ids: ["1", "2", "3", "4", "5", "6", "7"],
        ladder_directions: %{},
        ladder_crowding_toggles: %{},
        ordering: 1,
        is_current_tab: false,
        save_changes_to_tab_uuid: nil
      }

      tab_2 = %{
        tab_1
        | selected_route_ids: ["1", "2", "3", "4", "5", "6", "7", "8"],
          ordering: 2,
          uuid: Ecto.UUID.generate()
      }

      insert!(tab_1)
      insert!(tab_2)

      insert!(
        DbUserSettings.changeset(%DbUserSettings{}, %{
          user_id: user.id,
          ladder_page_vehicle_label: :vehicle_id,
          shuttle_page_vehicle_label: :run_id,
          vehicle_adherence_colors: :early_blue
        }),
        returning: true
      )

      {:ok, result} = Report.UserConfigurations.run()

      assert [
               %{
                 email: ^email,
                 ladder_page_vehicle_label: :vehicle_id,
                 routes_per_tab: "7,8",
                 shuttle_page_vehicle_label: :run_id,
                 user_uuid: ^uuid,
                 username: ^username,
                 vehicle_adherence_colors: :early_blue
               }
             ] = result
    end
  end

  describe "short_name/0" do
    test "returns short name" do
      assert Report.UserConfigurations.short_name() == "user_configurations"
    end
  end

  describe "description/0" do
    test "returns description" do
      assert Report.UserConfigurations.description() == "User settings & route tabs"
    end
  end
end
