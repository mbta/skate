defmodule Skate.Repo.Migrations.AddTripLabelToUserSettings do
  use Ecto.Migration

  def change do
    execute(
      "CREATE TYPE trip_label AS ENUM ('origin', 'destination')",
      "DROP TYPE trip_label"
    )

    alter table(:user_settings) do
      add(:minischedules_trip_label, :trip_label, default: "destination")
    end

    execute("UPDATE user_settings SET minischedules_trip_label = 'destination'", fn -> nil end)
  end
end
