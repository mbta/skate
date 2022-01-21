defmodule Schedule.Run do
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
end
