defmodule Skate.Repo.Migrations.AddOverrideForTestGroups do
  use Ecto.Migration

  def change do
    # excellent_migrations:safety-assured-for-this-file raw_sql_executed
    execute(
      "CREATE TYPE test_group_override AS ENUM ('none', 'enabled', 'disabled')",
      "DROP TYPE test_group_override"
    )

    alter table(:test_groups) do
      add(:override, :test_group_override, default: "none", null: false)
    end
  end
end
