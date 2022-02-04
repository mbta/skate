defmodule Skate.Repo.Migrations.RemoveUserSettingsTripLabel do
  use Ecto.Migration

  def up do
    alter table(:user_settings) do
      remove :minischedules_trip_label
    end

    execute "DROP TYPE trip_label"
  end

  def down do
    execute "CREATE TYPE trip_label AS ENUM ('origin', 'destination')"

    alter table(:user_settings) do
      add(:minischedules_trip_label, :trip_label, default: "destination")
    end

    execute "UPDATE user_settings SET minischedules_trip_label = 'destination'"
  end
end
