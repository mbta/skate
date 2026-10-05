defmodule Skate.Repo.Migrations.AddAutocloseOnToDetours do
  use Ecto.Migration

  def change do
    alter table(:detours) do
      add :autoclose_on, :utc_datetime_usec
    end
  end
end
