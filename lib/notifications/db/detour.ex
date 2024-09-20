defmodule Notifications.Db.Detour do
  @moduledoc """
  Ecto Model for Detour Notifications struct and Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder,
           only: [
             :__struct__,
             :status
           ]}

  typed_schema "detour_notifications" do
    belongs_to :detour, Skate.Detours.Db.Detour
    has_one :notification, Notifications.Db.Notification

    field :status, Ecto.Enum, values: [:activated]
  end

  def changeset(
        %__MODULE__{} = struct,
        attrs \\ %{}
      ) do
    struct
    |> cast(attrs, [
      :detour,
      :status
    ])
    |> validate_required([
      :detour,
      :status
    ])
  end
end
