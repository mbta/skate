defmodule Schedule.Gtfs.Shape do
  @moduledoc false

  alias Schedule.Csv
  alias Schedule.Gtfs.Shape.Point

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          points: [Point.t()]
        }

  @type shapes_by_id :: %{id() => t()}

  @enforce_keys [
    :id,
    :points
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    points: []
  ]

  @spec from_file(binary()) :: shapes_by_id()
  def from_file(file) do
    file
    |> Csv.parse(parse: &Point.from_csv_row/1)
    |> Enum.group_by(& &1.shape_id)
    |> Map.new(fn {shape_id, points} ->
      {
        shape_id,
        %__MODULE__{
          id: shape_id,
          points: Enum.sort_by(points, &Map.fetch(&1, :sequence))
        }
      }
    end)
  end

  @spec by_id(shapes_by_id(), id()) :: t() | nil
  def by_id(shapes_by_id, id), do: Map.get(shapes_by_id, id)
end

defmodule Schedule.Gtfs.Shape.Point do
  @moduledoc false

  alias Schedule.Csv
  alias Schedule.Gtfs.Shape

  @type t :: %__MODULE__{
          shape_id: Shape.id(),
          lat: float(),
          lon: float(),
          sequence: non_neg_integer()
        }

  @enforce_keys [
    :shape_id,
    :lat,
    :lon,
    :sequence
  ]

  @derive Jason.Encoder

  defstruct [
    :shape_id,
    :lat,
    :lon,
    :sequence
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    %__MODULE__{
      shape_id: row["shape_id"],
      lat: String.to_float(row["shape_pt_lat"]),
      lon: String.to_float(row["shape_pt_lon"]),
      sequence: String.to_integer(row["shape_pt_sequence"])
    }
  end
end
