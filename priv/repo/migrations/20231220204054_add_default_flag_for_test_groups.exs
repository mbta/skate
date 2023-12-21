defmodule Skate.Repo.Migrations.AddDefaultFlagForTestGroups do
  use Ecto.Migration

  def change do
    # excellent_migrations:safety-assured-for-this-file raw_sql_executed
    execute(
      "CREATE TYPE test_group_override AS ENUM ('none', 'enable', 'disable')",
      "DROP TYPE test_group_override"
    )

    alter table(:test_groups) do
      add(:override, :test_group_override)
    end
  end
end
