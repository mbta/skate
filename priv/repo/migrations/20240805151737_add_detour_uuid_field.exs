defmodule Skate.Repo.Migrations.AddDetourUuidField do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add(:uuid, :string)
    end
  end
end
