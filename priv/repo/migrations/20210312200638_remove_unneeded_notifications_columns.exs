defmodule Skate.Repo.Migrations.RemoveUnneededNotificationsColumns do
  use Ecto.Migration

  def change do
    alter table(:notifications) do
      remove :reason
      remove :route_ids
      remove :run_ids
      remove :trip_ids
      remove :operator_id
      remove :operator_name
      remove :route_id_at_creation
      remove :block_id
      remove :service_id
      remove :start_time
      remove :end_time
    end
  end
end
