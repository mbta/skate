defmodule Skate.Notifications.Db.DetourExpiration do
  @moduledoc """
  Ecto Schema for Detour Expiration Notifications
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Notifications

  @derive {Jason.Encoder,
           only: [
             :__struct__,
             :detour_id,
             :estimated_duration,
             :expires_in,
             :headsign,
             :route,
             :direction,
             :origin
           ]}

  typed_schema "detour_expiration_notification" do
    field(:estimated_duration, :string)
    field(:expires_in, :duration)

    belongs_to :detour, Skate.Detours.Db.Detour

    has_one :notification, Notifications.Db.Notification

    # Derived from the associated detour
    field :headsign, :any, virtual: true
    field :route, :any, virtual: true
    field :direction, :any, virtual: true
    field :origin, :any, virtual: true
  end

  @doc """
  Creates a new "Detour Expiration Notification"
  """
  def changeset(detour_expiration, attrs) do
    params = add_notification_params(attrs)

    detour_expiration
    |> cast(params, [:estimated_duration, :expires_in])
    |> cast_assoc(:notification, with: &Notifications.Db.Notification.changeset/2)
    |> validate_required([:estimated_duration, :expires_in, :detour_id])
    |> assoc_constraint(:detour)
  end

  defp add_notification_params(params) do
    params
    |> Map.put_new(:notification, %{})
    |> Map.update!(:notification, fn notification ->
      Map.put_new_lazy(notification, :users, fn ->
        Skate.Settings.User.list_users_with_route_ids([params.route_id])
      end)
    end)
  end
end
