defmodule Skate.Repo.Migrations.AddNotificationsCreatedAtIndex do
  use Ecto.Migration

  def change do
    create index("notifications", [:created_at])
  end
end
