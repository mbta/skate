defmodule Skate.Settings.RouteTab do
  import Ecto.Query

  alias Skate.Repo
  alias Schedule.Route
  alias Skate.Settings.Db.RouteTab, as: DbRouteTab
  alias Skate.Settings.User
  alias Skate.Settings.Db.User, as: DbUser

  @type t :: %__MODULE__{
          id: integer() | nil,
          preset_name: String.t() | nil,
          selected_route_ids: [Route.id()],
          ladder_directions: map(),
          ladder_crowding_toggles: map(),
          ordering: integer() | nil
        }

  @enforce_keys [:selected_route_ids, :ladder_directions, :ladder_crowding_toggles]

  @derive Jason.Encoder

  defstruct [
    :preset_name,
    :selected_route_ids,
    :ladder_directions,
    :ladder_crowding_toggles,
    :ordering,
    id: nil
  ]

  @spec get_all_for_user(String.t()) :: [t()]
  def get_all_for_user(username) do
    from(rt in DbRouteTab, join: u in assoc(rt, :user), where: u.username == ^username)
    |> Repo.all()
    |> Enum.map(fn db_route_tab ->
      %__MODULE__{
        id: db_route_tab.id,
        preset_name: db_route_tab.preset_name,
        selected_route_ids: db_route_tab.selected_route_ids,
        ladder_directions: db_route_tab.ladder_directions,
        ladder_crowding_toggles: db_route_tab.ladder_crowding_toggles,
        ordering: db_route_tab.ordering
      }
    end)
  end

  @spec update_all_for_user!(String.t(), [t()]) :: [t()]
  def update_all_for_user!(username, route_tabs) do
    username
    |> User.get_or_create()
    |> Repo.preload([:route_tabs])
    |> DbUser.changeset(%{route_tabs: Enum.map(route_tabs, &Map.from_struct/1)})
    |> Repo.update!()
    |> Map.get(:route_tabs)
    |> Enum.map(fn db_route_tab ->
      %__MODULE__{
        id: db_route_tab.id,
        preset_name: db_route_tab.preset_name,
        selected_route_ids: db_route_tab.selected_route_ids,
        ladder_directions: db_route_tab.ladder_directions,
        ladder_crowding_toggles: db_route_tab.ladder_crowding_toggles,
        ordering: db_route_tab.ordering
      }
    end)
  end
end
