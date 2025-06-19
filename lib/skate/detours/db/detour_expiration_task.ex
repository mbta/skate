defmodule Skate.Detours.Db.DetourExpirationTask do
  @moduledoc """
  Ecto Model for `detour_expiration_tasks` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Detours.Db.Detour

  typed_schema "detour_expiration_tasks" do
    belongs_to :detour, Detour
    field :expires_at, :utc_datetime_usec
    field :notification_offset_minutes, :integer

    timestamps()
  end

  def create_changeset(%{detour: %Skate.Detours.Db.Detour{} = detour} = attrs) do
    %__MODULE__{}
    |> cast(attrs, [:expires_at, :notification_offset_minutes])
    |> put_assoc(:detour, detour)
  end

  def update_changeset(nil, attrs) do
    create_changeset(attrs)
  end

  def update_changeset(detour_expiration_task, attrs) do
    cast(detour_expiration_task, attrs, [:expires_at])
  end
end
