defmodule Schedule.Minischedule.Run do
  alias Schedule.Trip
  alias Schedule.Minischedule.Break
  alias Schedule.Minischedule.Piece
  alias Schedule.Hastus.Run
  alias Schedule.Hastus.Schedule

  @type key :: {Schedule.id(), Run.id()}

  @type by_id :: %{key() => t()}

  @type t :: %__MODULE__{
          schedule_id: Schedule.id(),
          id: Run.id(),
          activities: [Piece.t() | Break.t()]
        }

  @enforce_keys [
    :schedule_id,
    :id,
    :activities
  ]

  defstruct [
    :schedule_id,
    :id,
    :activities
  ]

  @spec key(t()) :: key()
  def key(run) do
    {run.schedule_id, run.id}
  end

  @spec pieces(t()) :: [Piece.t()]
  def pieces(run) do
    Enum.filter(run.activities, fn activity -> match?(%Piece{}, activity) end)
  end

  defmodule Hydrated do
    @type t :: %__MODULE__{
            schedule_id: Schedule.id(),
            id: Run.id(),
            activities: [Piece.Hydrated.t() | Break.t()]
          }

    @enforce_keys [
      :schedule_id,
      :id,
      :activities
    ]

    defstruct [
      :schedule_id,
      :id,
      :activities
    ]
  end

  @spec hydrate(t(), Trip.by_id()) :: Hydrated.t()
  def hydrate(run, trips_by_id) do
    %Hydrated{
      schedule_id: run.schedule_id,
      id: run.id,
      activities:
        Enum.map(run.activities, fn
          %Break{} = break -> break
          %Piece{} = piece -> Piece.hydrate(piece, trips_by_id)
        end)
    }
  end
end
