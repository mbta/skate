defmodule Skate.Settings.RouteSetting do
  use Ecto.Schema
  import Ecto.Changeset

  alias Skate.Settings.LadderDirection

  @primary_key false

  @type t :: %__MODULE__{}

  embedded_schema do
    field(:route_id, :string)
    field(:ladder_direction, LadderDirection)
    field(:crowding_toggle, :boolean)
  end

  def changeset(route_setting, attrs \\ %{}) do
    route_setting
    |> cast(attrs, [:route_id, :ladder_direction, :crowding_toggle])
    |> validate_required([:route_id, :ladder_direction, :crowding_toggle])
  end

  def type, do: :map
end
