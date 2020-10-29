defmodule Skate.Settings.RouteSettings do
  import Ecto.Query
  import Skate.Repo

  alias Schedule.Route
  alias Skate.Settings.Db.RouteSettings, as: DbRouteSettings
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.User

  @type t :: %__MODULE__{
          selected_route_ids: [Route.id()],
          ladder_directions: map(),
          ladder_crowding_toggles: map()
        }

  @enforce_keys [:selected_route_ids, :ladder_directions, :ladder_crowding_toggles]
  @derive Jason.Encoder
  defstruct [:selected_route_ids, :ladder_directions, :ladder_crowding_toggles]

  @spec get_or_create(String.t()) :: t()
  def get_or_create(username) do
    user = User.get_or_create(username)

    route_settings =
      insert!(
        DbRouteSettings.changeset(%DbRouteSettings{}, %{
          user_id: user.id,
          selected_route_ids: [],
          ladder_directions: %{},
          ladder_crowding_toggles: %{}
        }),
        returning: true,
        conflict_target: [:user_id],
        on_conflict: {:replace, [:user_id]}
      )

    %__MODULE__{
      selected_route_ids: route_settings.selected_route_ids,
      ladder_directions: route_settings.ladder_directions,
      ladder_crowding_toggles: route_settings.ladder_crowding_toggles
    }
  end

  @spec set(String.t(), [{atom(), any()}]) :: :ok
  def set(username, new_values) do
    update_all(
      from(route_settings in "route_settings",
        join: user in DbUser,
        on: user.id == route_settings.user_id,
        where: user.username == ^username
      ),
      set: new_values
    )

    :ok
  end
end
