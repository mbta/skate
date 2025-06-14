defmodule Skate.Detours.Db.DetourExpirationNotification do
  @moduledoc """
  Ecto Model for `detour_expiration_notifications` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Detours.Db.Detour

  typed_schema "detour_expiration_notifications" do
    belongs_to :detour, Detour
    field :expires_at, :utc_datetime_usec

    timestamps()
  end

  def create_changeset(%{detour: detour} = attrs) do
    %__MODULE__{}
    |> cast(attrs, [:expires_at])
    |> put_assoc(:detour, detour)
  end

  def update_changeset(nil, attrs) do
    create_changeset(attrs)
  end

  def update_changeset(detour_expiration_notification, attrs) do
    cast(detour_expiration_notification, attrs, [:expires_at])
  end
end
