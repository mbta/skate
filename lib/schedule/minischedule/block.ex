defmodule Schedule.Minischedule.Block do
  alias Schedule.Block
  alias Schedule.Gtfs.Timepoint
  alias Schedule.Trip
  alias Schedule.Minischedule.Piece
  alias Schedule.Hastus.Schedule

  @type id :: Block.id()

  @type key :: {Schedule.id(), id()}

  @type by_id :: %{key() => t()}

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          id: id(),
          pieces: [Piece.t()]
        }

  @enforce_keys [
    :schedule_id,
    :id,
    :pieces
  ]

  @derive Jason.Encoder

  defstruct [
    :schedule_id,
    :id,
    :pieces
  ]

  @spec key(t()) :: key()
  def key(block) do
    {block.schedule_id, block.id}
  end

  @spec hydrate(t(), Trip.by_id(), Timepoint.timepoint_names_by_id()) :: t()
  def hydrate(block, trips_by_id, timepoint_names_by_id) do
    %{
      block
      | pieces: Enum.map(block.pieces, &Piece.hydrate(&1, trips_by_id, timepoint_names_by_id))
    }
  end
end
