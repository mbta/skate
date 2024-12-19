defmodule Skate.Repo.Migrations.AddDetourActivatedAtField do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :activated_at, :utc_datetime_usec
    end
  end
end
