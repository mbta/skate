defmodule Schedule.Run do
  @moduledoc false

  alias Schedule.Gtfs.Service
  alias Schedule.Break
  alias Schedule.Piece
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

  @spec active?(t(), Util.Time.time_of_day(), Util.Time.time_of_day()) ::
          boolean()
  def active?(run, start_time_of_day, end_time_of_day) do
    run
    |> pieces()
    |> Enum.map(fn piece ->
      trips = Enum.reject(piece.trips, &is_nil/1)

      {trips |> Enum.map(& &1.start_time) |> Enum.min(),
       trips |> Enum.map(& &1.end_time) |> Enum.max()}
    end)
    |> Enum.any?(fn {start_time, end_time} ->
      end_time_of_day > start_time and start_time_of_day < end_time
    end)
  end
end
