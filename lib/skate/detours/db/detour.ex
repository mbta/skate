defmodule Skate.Detours.Db.Detour do
  @moduledoc """
  Ecto Model for `detours` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  typed_schema "detours" do
    field :state, :map
    belongs_to :author, User

    timestamps()
  end

  def changeset(detour, attrs) do
    detour
    |> cast(attrs, [:state])
    |> validate_required([:state])
  end
end
