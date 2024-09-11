defmodule Notifications.Db.BridgeMovement do
  @moduledoc false

  use Skate.Schema
  import Ecto.Changeset

  alias Notifications.BridgeStatus

  typed_schema "bridge_movements" do
    field(:status, BridgeStatus)
    field(:lowering_time, :integer)
    timestamps()
  end

  def changeset(bridge_movement, attrs \\ %{}) do
    bridge_movement
    |> cast(attrs, [:status, :lowering_time])
    |> validate_required([:status])
  end
end
