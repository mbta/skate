defmodule Skate.Settings.RouteSettings do
  import Skate.Repo
  alias Skate.Settings.Db.RouteSettings, as: DbRouteSettings
  alias Skate.Settings.RouteSetting
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
          settings: []
        }),
        returning: true,
        conflict_target: [:user_id],
        on_conflict: {:replace, [:user_id]}
      )

    %__MODULE__{settings: route_settings}
  end
end
