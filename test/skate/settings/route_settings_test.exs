defmodule Skate.Settings.RouteSettingsTest do
  use Skate.DataCase
  alias Skate.Settings.RouteSettings
  alias Skate.Settings.Db.RouteSettings, as: DbRouteSettings
  alias Skate.Settings.Db.User, as: DbUser

  describe "get_or_create/1" do
    test "creates default record if no settings in DB for user yet" do
      original_n_route_settings = Skate.Repo.aggregate(DbRouteSettings, :count)
      assert original_n_route_settings == 0

      RouteSettings.get_or_create("charlie")

      n_route_settings = Skate.Repo.aggregate(DbRouteSettings, :count)
      assert n_route_settings == 1
      [sole_record] = Skate.Repo.all(DbRouteSettings)

      assert %{
               ladder_crowding_toggles: %{},
               ladder_directions: %{},
               selected_route_ids: []
             } = sole_record

      [sole_user] = Skate.Repo.all(DbUser)
      assert %{username: "charlie"} = sole_user
      assert sole_user.id == sole_record.user_id
    end

    test "returns existing record if one present" do
      user_changeset = DbUser.changeset(%DbUser{}, %{"username" => "charlie"})
      {:ok, user} = Skate.Repo.insert(user_changeset)

      route_settings_changeset =
        DbRouteSettings.changeset(%DbRouteSettings{}, %{
          selected_route_ids: ["39", "77"],
          ladder_directions: %{"66" => 1},
          ladder_crowding_toggles: %{"83" => true},
          user_id: user.id
        })

      {:ok, _route_settings} = Skate.Repo.insert(route_settings_changeset)

      result = RouteSettings.get_or_create("charlie")

      assert %{
               selected_route_ids: ["39", "77"],
               ladder_directions: %{"66" => 1},
               ladder_crowding_toggles: %{"83" => true}
             } = result
    end
  end

  describe "set/2" do
    test "updates existing record" do
      user_changeset = DbUser.changeset(%DbUser{}, %{"username" => "charlie"})
      {:ok, user} = Skate.Repo.insert(user_changeset)

      route_settings_changeset =
        DbRouteSettings.changeset(%DbRouteSettings{}, %{
          selected_route_ids: ["39", "77"],
          ladder_directions: %{"66" => 1},
          ladder_crowding_toggles: %{"83" => true},
          user_id: user.id
        })

      {:ok, _route_settings} = Skate.Repo.insert(route_settings_changeset)

      RouteSettings.set(
        "charlie",
        [
          {:selected_route_ids, ["12", "34", "56"]},
          {:ladder_directions, %{"39" => 1, "77" => 0}},
          {:ladder_crowding_toggles, %{"741" => true}}
        ]
      )

      [sole_record] = Skate.Repo.all(DbRouteSettings)

      assert %{
               ladder_crowding_toggles: %{"741" => true},
               ladder_directions: %{"39" => 1, "77" => 0},
               selected_route_ids: ["12", "34", "56"]
             } = sole_record
    end
  end
end
