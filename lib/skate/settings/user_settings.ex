defmodule Skate.Settings.UserSettings do
  import Skate.Repo
  import Ecto.Query

  alias Skate.Settings.User
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings
  alias Skate.Settings.TripLabel
  alias Skate.Settings.VehicleLabel
  alias Skate.Settings.VehicleAdherenceColor

  @type t :: %__MODULE__{
          ladder_page_vehicle_label: VehicleLabel.t(),
          shuttle_page_vehicle_label: VehicleLabel.t(),
          vehicle_adherence_colors: VehicleAdherenceColor.t(),
          minischedules_trip_label: TripLabel.t()
        }

  @enforce_keys [
    :ladder_page_vehicle_label,
    :shuttle_page_vehicle_label,
    :vehicle_adherence_colors,
    :minischedules_trip_label
  ]

  @derive Jason.Encoder

  defstruct [
    :ladder_page_vehicle_label,
    :shuttle_page_vehicle_label,
    :vehicle_adherence_colors,
    :minischedules_trip_label
  ]

  @spec get_or_create(String.t()) :: t()
  def get_or_create(username) do
    user = User.get_or_create(username)

    user_settings =
      insert!(
        DbUserSettings.changeset(%DbUserSettings{}, %{
          user_id: user.id,
          # defaults, which won't get written if it exists
          ladder_page_vehicle_label: :run_id,
          shuttle_page_vehicle_label: :vehicle_id,
          vehicle_adherence_colors: :early_red,
          minischedules_trip_label: :destination
        }),
        returning: true,
        conflict_target: [:user_id],
        on_conflict: {:replace, [:user_id]}
      )

    %__MODULE__{
      ladder_page_vehicle_label: user_settings.ladder_page_vehicle_label,
      shuttle_page_vehicle_label: user_settings.shuttle_page_vehicle_label,
      vehicle_adherence_colors: user_settings.vehicle_adherence_colors,
      minischedules_trip_label: user_settings.minischedules_trip_label
    }
  end

  @spec set(String.t(), atom(), any()) :: :ok
  def set(username, field, value) do
    {:ok, db_value} = db_value(field, value)

    update_all(
      from(user_settings in "user_settings",
        join: user in DbUser,
        on: user.id == user_settings.user_id,
        where: user.username == ^username
      ),
      set: [{field, db_value}]
    )

    :ok
  end

  @spec db_value(atom(), atom()) :: {:ok, String.t()} | :error
  defp db_value(:ladder_page_vehicle_label, value), do: VehicleLabel.dump(value)
  defp db_value(:shuttle_page_vehicle_label, value), do: VehicleLabel.dump(value)
  defp db_value(:vehicle_adherence_colors, value), do: VehicleAdherenceColor.dump(value)
  defp db_value(:minischedules_trip_label, value), do: TripLabel.dump(value)
end
