defmodule Notifications.Db.BridgeMovement do
  @moduledoc """
  Ecto Model for `bridge_movements` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Notifications.BridgeStatus

  @derive {Jason.Encoder,
           only: [
             :__struct__,
             :status,
             :lowering_time,
             :inserted_at
           ]}

  typed_schema "bridge_movements" do
    field(:status, BridgeStatus)
    field(:lowering_time, :integer)

    timestamps()

    has_one :notification, Notifications.Db.Notification
  end

  @valid_test_options []
  if Mix.env() == :test, do: @valid_test_options([:inserted_at, :updated_at])

  def changeset(bridge_movement, attrs \\ %{}) do
    bridge_movement
    |> cast(%{notification: %{}}, [])
    |> cast(attrs, [:status, :lowering_time | @valid_test_options])
    |> cast_assoc(:notification)
    |> validate_required([:status])
  end
end
