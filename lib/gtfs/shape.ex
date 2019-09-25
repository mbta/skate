defmodule Gtfs.Shape do
  alias Gtfs.Shape.Point

  @type id :: String.t()

  @type t :: %__MODULE__{
          id: id(),
          points: [Point.t()]
        }

  @enforce_keys [
    :id,
    :points
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    points: []
  ]
end

defmodule Gtfs.Shape.Point do
  alias Gtfs.{Csv, Shape}

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
