defmodule Notifications.Db.BlockWaiver do
  @moduledoc """
  Ecto Model for `block_waivers` Database table
  """

  use Skate.Schema
  import Ecto.Changeset
  alias Notifications.NotificationReason

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
  end

  def changeset(block_waiver, attrs \\ %{}) do
    block_waiver
    |> cast(attrs, [
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
end
