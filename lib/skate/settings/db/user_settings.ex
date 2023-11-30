defmodule Skate.Settings.Db.UserSettings do
  @moduledoc false

  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User
  alias Skate.Settings.VehicleLabel
  alias Skate.Settings.VehicleAdherenceColor

  @primary_key false

  @type t :: %__MODULE__{}

  schema "user_settings" do
    belongs_to(:user, User, primary_key: true)
    field(:ladder_page_vehicle_label, VehicleLabel)
    field(:shuttle_page_vehicle_label, VehicleLabel)
    field(:vehicle_adherence_colors, VehicleAdherenceColor)
    timestamps()
  end

  def changeset(user_settings, attrs \\ %{}) do
    user_settings
    |> cast(attrs, [
      :user_id,
      :ladder_page_vehicle_label,
      :shuttle_page_vehicle_label,
      :vehicle_adherence_colors
    ])
    |> validate_required([
      :user_id,
      :ladder_page_vehicle_label,
      :shuttle_page_vehicle_label,
      :vehicle_adherence_colors
    ])
  end
end
