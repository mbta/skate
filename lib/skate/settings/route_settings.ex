defmodule Skate.Settings.RouteSettings do
  import Ecto.Query
  import Skate.Repo

  alias Skate.Settings.Db.RouteSettings, as: DbRouteSettings
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.User

  @type t :: %__MODULE__{settings: [RouteSetting.t()]}

  @enforce_keys [:settings]
  @derive Jason.Encoder
  defstruct [:settings]

  @spec get_or_create(String.t()) :: t()
  def get_or_create(username) do
    user = User.get_or_create(username)

    route_settings =
      insert!(
        DbRouteSettings.changeset(%DbRouteSettings{}, %{
          user_id: user.id,
          route_ids: [],
          ladder_directions: %{},
          crowding_toggles: %{}
        }),
        returning: true,
        conflict_target: [:user_id],
        on_conflict: {:replace, [:user_id]}
      )

    %__MODULE__{settings: route_settings}
  end

  @spec set(String.t(), [RouteSetting.t()]) :: :ok
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
