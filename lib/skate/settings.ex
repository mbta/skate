defmodule Skate.Settings do
  import Skate.Repo

  alias Skate.Settings.User
  alias Skate.Settings.UserSettings
  alias Skate.Settings.VehicleLabel

  @type t :: %__MODULE__{
          ladder_page_vehicle_label: VehicleLabel.t(),
          shuttle_page_vehicle_label: VehicleLabel.t()
        }

  @enforce_keys [
    :ladder_page_vehicle_label,
    :shuttle_page_vehicle_label
  ]

  defstruct [
    :ladder_page_vehicle_label,
    :shuttle_page_vehicle_label
  ]

  @spec get_or_create(String.t()) :: t()
  def get_or_create(username) do
    user =
      insert!(
        User.changeset(%User{}, %{username: username}),
        returning: true,
        conflict_target: [:username],
        # update a row with no effect so the returning works
        on_conflict: {:replace, [:username]}
      )

    user_settings =
      insert!(
        UserSettings.changeset(%UserSettings{}, %{
          user_id: user.id,
          # defaults, which won't get written if it exists
          ladder_page_vehicle_label: :run_id,
          shuttle_page_vehicle_label: :vehicle_id
        }),
        returning: true,
        conflict_target: [:user_id],
        on_conflict: {:replace, [:user_id]}
      )

    %__MODULE__{
      ladder_page_vehicle_label: user_settings.ladder_page_vehicle_label,
      shuttle_page_vehicle_label: user_settings.shuttle_page_vehicle_label
    }
  end
end
