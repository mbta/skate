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

  def changeset(bridge_movement, params \\ %{}) do
    params = add_notification_params(params)

    bridge_movement
    |> cast(params, [:status, :lowering_time | @valid_test_options])
    |> cast_assoc(:notification)
    |> validate_required([:status])
  end

  defp add_notification_params(params) do
    params
    |> Map.put_new(:notification, %{})
    |> Map.update!(:notification, fn notification ->
      Map.put_new_lazy(notification, :users, fn ->
        params
        |> Map.get(:bridge_route_ids, [])
        |> Skate.Settings.User.list_users_with_route_ids()
      end)
    end)
  end
end
