defmodule Schedule.Minischedule.Block do
  alias Schedule.Block
  alias Schedule.Trip
  alias Schedule.Minischedule.Piece
  alias Schedule.Hastus.Schedule

  @type key :: {Schedule.id(), Block.id()}

  @type by_id :: %{key() => t()}

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          id: Block.id(),
          pieces: [Piece.t()]
        }

  @enforce_keys [
    :schedule_id,
    :id,
    :pieces
  ]

  defstruct [
    :schedule_id,
    :id,
    :pieces
  ]

  @spec key(t()) :: key()
  def key(block) do
    {block.schedule_id, block.id}
  end

  defmodule Hydrated do
    @type t :: %__MODULE__{
            schedule_id: Schedule.id(),
            id: Block.id(),
            pieces: [Piece.Hydrated.t()]
          }

    @enforce_keys [
      :schedule_id,
      :id,
      :pieces
    ]

    defstruct [
      :schedule_id,
      :id,
      :pieces
    ]
  end

  @spec hydrate(t(), Trip.by_id()) :: Hydrated.t()
  def hydrate(block, trips_by_id) do
    %Hydrated{
      schedule_id: block.schedule_id,
      id: block.id,
      pieces: Enum.map(block.pieces, fn piece -> Piece.hydrate(piece, trips_by_id) end)
    }
  end
end
