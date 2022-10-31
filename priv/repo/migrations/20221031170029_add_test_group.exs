defmodule Skate.Repo.Migrations.AddTestGroup do
  use Ecto.Migration

  def change do
    create table(:test_groups) do
      add(:name, :string, null: false)
      timestamps()
    end

    create table(:test_groups_users) do
      add(
        :test_group_id,
        references(:test_groups,
          on_delete: :delete_all,
          on_update: :update_all
        ),
        primary_key: true
      )

      add(
        :user_id,
        references(:users, on_delete: :delete_all, on_update: :update_all),
        primary_key: true
      )

      timestamps()
    end

    create(
      index(
        :test_groups,
        [:name],
        unique: true,
        name: "test_groups_unique_index"
      )
    )
  end
end
