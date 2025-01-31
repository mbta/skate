defmodule Skate.Detours.Db.Detour do
  @moduledoc """
  Ecto Model for `detours` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  typed_schema "detours" do
    field :state, :map

    field(:status, Ecto.Enum, values: [:draft, :active, :past])

    belongs_to :author, User

    # When this detour was activated
    field :activated_at, :utc_datetime_usec

    timestamps()
  end

  def changeset(detour, attrs) do
    detour
    |> cast(attrs, [:state, :activated_at])
    |> validate_required([:state])
    |> foreign_key_constraint(:author_id)
  end
end
