defmodule Skate.Notifications.Db.BlockWaiver do
  @moduledoc """
  Ecto Model for `block_waivers` Database table
  """

  use Skate.Schema
  import Ecto.Changeset
  alias Skate.Notifications
  alias Skate.Notifications.NotificationReason

  @derive {Jason.Encoder,
           only: [
             :__struct__,
             :created_at,
             :reason,
             :route_ids,
             :run_ids,
             :trip_ids,
             :operator_id,
             :operator_name,
             :route_id_at_creation,
             :block_id,
             :service_id,
             :start_time,
             :end_time
           ]}

  typed_schema "block_waivers" do
    field(:created_at, :integer)
    field(:reason, NotificationReason)
    field(:route_ids, {:array, :string})
    field(:run_ids, {:array, :string})
    field(:trip_ids, {:array, :string})
    field(:operator_id, :string)
    field(:operator_name, :string)
    field(:route_id_at_creation, :string)
    field(:block_id, :string)
    field(:service_id, :string)
    field(:start_time, :integer)
    field(:end_time, :integer)
    timestamps()

    has_one(:notification, Notifications.Db.Notification)
  end

  def changeset(block_waiver, attrs \\ %{}) do
    params = add_notification_params(attrs)

    block_waiver
    |> cast(params, [
      :id,
      :created_at,
      :reason,
      :route_ids,
      :run_ids,
      :trip_ids,
      :operator_id,
      :operator_name,
      :route_id_at_creation,
      :block_id,
      :service_id,
      :start_time,
      :end_time
    ])
    |> validate_required([
      :created_at,
      :reason,
      :route_ids,
      :run_ids,
      :trip_ids,
      :block_id,
      :service_id,
      :start_time,
      :end_time
    ])
    |> cast_assoc(:notification)
    |> unique_constraint(
      [
        :start_time,
        :end_time,
        :block_id,
        :service_id,
        :reason
      ],
      name: "block_waivers_unique_index"
    )
  end

  defp add_notification_params(params) do
    params
    # Insert a notification to be created via `cast_assoc/2`
    |> Map.put_new(:notification, %{})
    |> Map.update!(:notification, fn notification ->
      Map.put_new_lazy(notification, :users, fn ->
        Skate.Settings.User.list_users_with_route_ids(params[:route_ids])
      end)
    end)
  end
end
