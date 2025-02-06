defmodule Skate.Detours.Db.Detour do
  @moduledoc """
  Ecto Model for `detours` Database table
  """

  use Skate.Schema
  import Ecto.Changeset

  alias Skate.Settings.Db.User

  @type status :: :active | :draft | :past

  typed_schema "detours" do
    field :state, :map

    field(:status, Ecto.Enum, values: [:draft, :active, :past]) :: status()

    belongs_to :author, User

    # When this detour was activated
    field :activated_at, :utc_datetime_usec

    timestamps()
  end

  def changeset(detour, attrs) do
    detour
    |> cast(attrs, [:state, :activated_at])
    |> add_status()
    |> validate_required([:state, :status])
    |> foreign_key_constraint(:author_id)
  end

  defp add_status(changeset) do
    case fetch_change(changeset, :state) do
      {:ok, state} ->
        # Once this column is added for all detours, `categorize_detour` logic
        # should be moved here and should not be needed anymore
        put_change(changeset, :status, Skate.Detours.Detours.categorize_detour(%{state: state}))

      _ ->
        changeset
    end
  end
end
