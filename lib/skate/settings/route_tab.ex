defmodule Skate.Settings.RouteTab do
  import Ecto.Query

  alias Skate.Repo
  alias Schedule.Route
  alias Skate.Settings.Db.RouteTab, as: DbRouteTab
  alias Skate.Settings.User

  @type t :: %__MODULE__{
          id: integer() | nil,
          preset_name: String.t() | nil,
          selected_route_ids: [Route.id()],
          ladder_directions: map(),
          ladder_crowding_toggles: map()
        }

  @enforce_keys [:selected_route_ids, :ladder_directions, :ladder_crowding_toggles]

  @derive Jason.Encoder

  defstruct [
    :preset_name,
    :selected_route_ids,
    :ladder_directions,
    :ladder_crowding_toggles,
    id: nil
  ]

  @spec create(String.t()) :: t()
  def create(username) do
    user = User.get_or_create(username)

    route_tab =
      Repo.insert!(
        DbRouteTab.changeset(%DbRouteTab{}, %{
          user_id: user.id,
          selected_route_ids: [],
          ladder_directions: %{},
          ladder_crowding_toggles: %{}
        }),
        returning: true
      )

    %__MODULE__{
      id: route_tab.id,
      selected_route_ids: route_tab.selected_route_ids,
      ladder_directions: route_tab.ladder_directions,
      ladder_crowding_toggles: route_tab.ladder_crowding_toggles
    }
  end

  @spec get_all_for_user(String.t()) :: [t()]
  def get_all_for_user(username) do
    from(rt in DbRouteTab, join: u in assoc(rt, :user), where: u.username == ^username)
    |> Repo.all()
    |> Enum.map(fn db_route_tab ->
      %__MODULE__{
        id: db_route_tab.id,
        selected_route_ids: db_route_tab.selected_route_ids,
        ladder_directions: db_route_tab.ladder_directions,
        ladder_crowding_toggles: db_route_tab.ladder_crowding_toggles
      }
    end)
  end

  @spec set(t(), map()) :: t()
  def set(route_tab, attrs) do
    DbRouteTab
    |> Repo.get(route_tab.id)
    |> DbRouteTab.changeset(attrs)
    |> Repo.update!()
  end
end
