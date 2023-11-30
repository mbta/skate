defmodule Skate.Settings.RouteTab do
  @moduledoc false

  import Ecto.Query

  alias Skate.Repo
  alias Schedule.Route
  alias Skate.Settings.Db.RouteTab, as: DbRouteTab
  alias Skate.Settings.User
  alias Skate.Settings.Db.User, as: DbUser

  @type t :: %__MODULE__{
          uuid: Ecto.UUID.t(),
          preset_name: String.t() | nil,
          selected_route_ids: [Route.id()],
          ladder_directions: map(),
          ladder_crowding_toggles: map(),
          ordering: integer() | nil,
          is_current_tab: boolean() | nil,
          save_changes_to_tab_uuid: Ecto.UUID.t() | nil
        }

  @enforce_keys [:uuid, :selected_route_ids, :ladder_directions, :ladder_crowding_toggles]

  @derive Jason.Encoder

  defstruct [
    :uuid,
    :preset_name,
    :selected_route_ids,
    :ladder_directions,
    :ladder_crowding_toggles,
    :ordering,
    :is_current_tab,
    :save_changes_to_tab_uuid
  ]

  @spec get_all_for_user(DbUser.id()) :: [t()]
  def get_all_for_user(user_id) do
    from(rt in DbRouteTab, join: u in assoc(rt, :user), where: u.id == ^user_id)
    |> Repo.all()
    |> Enum.map(&db_route_tab_to_route_tab(&1))
  end

  @spec update_all_for_user!(DbUser.id(), [t()]) :: [t()]
  def update_all_for_user!(user_id, route_tabs) do
    # Do update in two stages to prevent foreign key constaint problem. A route_tabs entry
    # with unsaved modifications will have a save_changes_to_tab_uuid value pointing to the
    # original, unmodified entry (which itself will always be a preset as of currently). An
    # entry with unsaved modifications will point directly to a saved entry, that is with
    # save_changes_to_tab_uuid null, so there are no multiple levels of recursion or cycles.
    unmodified_route_tabs =
      Enum.filter(route_tabs, fn route_tab -> is_nil(route_tab.save_changes_to_tab_uuid) end)

    user_id
    |> User.get_by_id!()
    |> Repo.preload(:route_tabs)
    |> DbUser.changeset(%{route_tabs: Enum.map(unmodified_route_tabs, &Map.from_struct/1)})
    |> Repo.update!()
    |> DbUser.changeset(%{route_tabs: Enum.map(route_tabs, &Map.from_struct/1)})
    |> Repo.update!()
    |> Map.get(:route_tabs)
    |> Enum.map(&db_route_tab_to_route_tab(&1))
  end

  @spec tab_open?(t()) :: boolean()
  def tab_open?(route_tab), do: !is_nil(route_tab.ordering)

  @spec db_route_tab_to_route_tab(DbRouteTab.t()) :: t()
  defp db_route_tab_to_route_tab(db_route_tab) do
    %__MODULE__{
      uuid: db_route_tab.uuid,
      preset_name: db_route_tab.preset_name,
      selected_route_ids: db_route_tab.selected_route_ids,
      ladder_directions: db_route_tab.ladder_directions,
      ladder_crowding_toggles: db_route_tab.ladder_crowding_toggles,
      ordering: db_route_tab.ordering,
      is_current_tab: db_route_tab.is_current_tab,
      save_changes_to_tab_uuid: db_route_tab.save_changes_to_tab_uuid
    }
  end
end
