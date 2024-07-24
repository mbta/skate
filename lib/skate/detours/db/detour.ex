defmodule Skate.Detours.Db.Detour do
  @moduledoc false

  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  schema "detours" do
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
