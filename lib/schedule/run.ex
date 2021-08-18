defmodule Schedule.Run do
  alias Schedule.Gtfs.Service
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
end
