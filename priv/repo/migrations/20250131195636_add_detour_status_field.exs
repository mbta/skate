defmodule Skate.Repo.Migrations.AddDetourStatusField do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :status, :string
    end
  end
end
