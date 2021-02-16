defmodule Skate.Repo.Migrations.AddVehicleAdherenceColorToUserSetting do
  use Ecto.Migration

  def change do
    execute(
      "CREATE TYPE vehicle_adherence_colors AS ENUM ('early_red', 'early_blue')",
      "DROP TYPE vehicle_adherence_colors"
    )

    alter table(:user_settings) do
      add(:vehicle_adherence_colors, :vehicle_adherence_colors, default: "early_red")
    end

    execute("UPDATE user_settings SET vehicle_adherence_colors = 'early_red'", fn -> end)
  end
end
