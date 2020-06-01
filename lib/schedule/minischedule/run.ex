defmodule Schedule.Minischedule.Run do
  alias Schedule.Trip
  alias Schedule.Minischedule.Break
  alias Schedule.Minischedule.Piece
  alias Schedule.Hastus.Run
  alias Schedule.Hastus.Schedule

  @type key :: {Schedule.id(), Run.id()}

  @type by_id :: %{key() => t()}

  @type timepoint_names_by_id :: %{String.t() => String.t()}

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

  @derive Jason.Encoder

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

  @spec hydrate(t(), Trip.by_id(), timepoint_names_by_id()) :: t()
  def hydrate(run, trips_by_id, timepoint_names_by_id) do
    %{
      run
      | activities:
          Enum.map(run.activities, &hydrate_activity(&1, trips_by_id, timepoint_names_by_id))
    }
  end

  @spec hydrate_activity(Piece.t() | Break.t(), Trip.by_id(), timepoint_names_by_id()) ::
          Piece.t() | Break.t()
  def hydrate_activity(%Break{} = break, _trips_by_id, timepoint_names_by_id) do
    %Break{
      break
      | start_place: Map.get(timepoint_names_by_id, break.start_place),
        end_place: Map.get(timepoint_names_by_id, break.end_place)
    }
  end

  def hydrate_activity(%Piece{} = piece, trips_by_id, timepoint_names_by_id) do
    Piece.hydrate(piece, trips_by_id, timepoint_names_by_id)
  end
end
