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

  def changeset(bridge_movement, attrs \\ %{}) do
    bridge_movement
    |> cast(%{notification: %{}}, [])
    |> cast(attrs, [:status, :lowering_time])
    |> cast_assoc(:notification)
    |> cast_timestamps_in_test(attrs)
    |> validate_required([:status])
  end

  if Mix.env() == :test do
    def cast_timestamps_in_test(changeset, attrs) do
      cast(changeset, attrs, [:inserted_at, :updated_at])
    end
  else
    def cast_timestamps_in_test(changeset, _attrs), do: changeset
  end
end
