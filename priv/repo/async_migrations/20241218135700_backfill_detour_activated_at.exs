defmodule Skate.Repo.Migrations.BackfillDetourActivatedAt do
  # https://fly.io/phoenix-files/backfilling-data/

  import Ecto.Query
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def up do
    # The 'backfilling-data' blog post suggests using a "throttle" function
    # so that we don't update too many at once, but we currently have less than
    # 1000 detours, so I think this will be negligable and not worth the
    # complexity cost at _this_ time.
    repo().update_all(
      from(
        r in Skate.Repo.Migrations.BackfillDetourActivatedAt.MigratingSchema,
        select: r.id,
        where:
          not is_nil(r.state["value"]["Detour Drawing"]["Active"]) and is_nil(r.activated_at),
        update: [set: [activated_at: r.updated_at]]
      ),
      [],
      log: :info
    )
  end

  def down, do: :ok
end

defmodule Skate.Repo.Migrations.BackfillDetourActivatedAt.MigratingSchema do
  @moduledoc """
  Detours database table schema frozen at this point in time.
  """

  use Skate.Schema

  alias Skate.Settings.Db.User

  typed_schema "detours" do
    field :state, :map
    belongs_to :author, User

    # When this detour was activated
    field :activated_at, :utc_datetime_usec

    timestamps()
  end
end
