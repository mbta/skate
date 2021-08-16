defmodule Schedule.Run do
  alias Schedule.Gtfs.Service
  alias Schedule.Gtfs.Timepoint
  alias Schedule.Trip
  alias Schedule.Break
  alias Schedule.Piece
  alias Schedule.AsDirected
  alias Schedule.Hastus.Run

  @type key :: {Schedule.Hastus.Schedule.id(), Run.id()}

  @type by_id :: %{key() => t()}

  @type t :: %__MODULE__{
          schedule_id: Schedule.Hastus.Schedule.id(),
          service_id: Service.id() | nil,
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
    :service_id,
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

  @spec is_active?(t(), Trip.by_id(), Util.Time.time_of_day(), Util.Time.time_of_day()) ::
          boolean()
  def is_active?(run, trips_by_id, start_time_of_day, end_time_of_day) do
    run
    |> pieces()
    |> Enum.map(fn piece ->
      trip_ids = piece.trips

      trips =
        Enum.map(trip_ids, fn
          trip_id when is_binary(trip_id) ->
            Map.get(trips_by_id, trip_id)

          %Trip{} = trip ->
            Map.get(trips_by_id, trip.id)

          %AsDirected{} = as_directed ->
            as_directed
        end)
        |> Enum.reject(&is_nil(&1))

      {trips |> Enum.map(& &1.start_time) |> Enum.min(),
       trips |> Enum.map(& &1.end_time) |> Enum.max()}
    end)
    |> Enum.any?(fn {start_time, end_time} ->
      end_time_of_day > start_time and start_time_of_day < end_time
    end)
  end

  @spec hydrate(t(), Trip.by_id(), Timepoint.timepoint_names_by_id()) :: t()
  def hydrate(run, trips_by_id, timepoint_names_by_id) do
    %{
      run
      | activities:
          Enum.map(run.activities, &hydrate_activity(&1, trips_by_id, timepoint_names_by_id))
    }
  end

  @spec hydrate_activity(Piece.t() | Break.t(), Trip.by_id(), Timepoint.timepoint_names_by_id()) ::
          Piece.t() | Break.t()
  def hydrate_activity(%Break{} = break, _trips_by_id, timepoint_names_by_id) do
    %Break{
      break
      | start_place: Timepoint.pretty_name_for_id(timepoint_names_by_id, break.start_place),
        end_place: Timepoint.pretty_name_for_id(timepoint_names_by_id, break.end_place)
    }
  end

  def hydrate_activity(%Piece{} = piece, trips_by_id, timepoint_names_by_id) do
    Piece.hydrate(piece, trips_by_id, timepoint_names_by_id)
  end
end
