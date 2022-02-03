defmodule Skate.Repo.Migrations.RemoveUserSettingsTripLabel do
  use Ecto.Migration

  def change do
    alter table(:user_settings) do
      remove :minischedules_trip_label
    end
  end
end
