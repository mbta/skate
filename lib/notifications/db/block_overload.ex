defmodule Notifications.Db.BlockOverload do
  import Ecto.Changeset
  use Ecto.Schema

  @type t() :: %__MODULE__{}

  schema "block_overloads" do
    field(:created_on, :date)
    field(:vehicle_id, :string)
    field(:operator_id, :string)
    field(:operator_name, :string)
    field(:block_id, :string)
    timestamps()
  end

  def changeset(block_overload, attrs \\ %{}) do
    block_overload
    |> cast(
      attrs,
      [:created_on, :vehicle_id, :operator_id, :operator_name, :block_id]
    )
    |> validate_required([:created_on, :vehicle_id, :block_id])
    |> unique_constraint(
      [:created_on, :vehicle_id, :block_id],
      name: "block_overloads_created_on_vehicle_id_block_id_index"
    )
  end
end
