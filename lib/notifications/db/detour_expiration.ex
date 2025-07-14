defmodule Notifications.Db.DetourExpiration do
  @moduledoc """
  Ecto Schema for Detour Expiration Notifications
  """

  use Skate.Schema
  import Ecto.Changeset

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
    params =
      attrs
      # A `%DetourExpiration{}` should always have a associated notification, so
      # add a placeholder to the params in case `attrs` does not contain it.
      |> Map.put_new(:notification, %{})
      # All users are given a detour expiration notification at this time,
      # so it is configured as default in the changeset
      |> put_in([:notification, :users], Skate.Settings.User.get_all())

    detour_expiration
    |> cast(params, [:estimated_duration, :expires_in])
    |> cast_assoc(:notification, with: &Notifications.Db.Notification.changeset/2)
    |> validate_required([:estimated_duration, :expires_in, :detour_id])
    |> assoc_constraint(:detour)
  end
end
