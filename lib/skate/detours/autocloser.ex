defmodule Skate.Detours.Autocloser do
  @moduledoc false

  use Oban.Worker,
    queue: :default,
    unique: [
      period: :infinity,
      states: :incomplete,
      keys: [:detour_id]
    ]

  alias Skate.Detours.Autoclosing
  alias Skate.Detours.Db.Detour
  alias Skate.Detours.Detours
  alias Skate.Repo

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{"detour_id" => detour_id}
      })
      when is_integer(detour_id) do
    case Repo.get(Detour, detour_id) do
      %Detour{} = detour ->
        Detours.autoclose_detour(detour)

      nil ->
        {:cancel, :detour_does_not_exist}
    end
  end

  @spec schedule(Detour.t()) ::
          {:ok, Oban.Job.t()} | {:ok, nil} | {:error, Oban.Job.changeset() | term()}
  def schedule(%Detour{} = detour) do
    if Autoclosing.enabled?() do
      %{detour_id: detour.id}
      |> __MODULE__.new(scheduled_at: detour.autoclose_on)
      |> Oban.insert()
    else
      {:ok, nil}
    end
  end

  @spec reschedule(
          Ecto.Changeset.t(),
          Detour.t()
        ) :: {:ok, Oban.Job.t()} | {:ok, nil} | {:error, Oban.Job.changeset() | term()}
  def reschedule(_changeset, detour) do
    if Autoclosing.enabled?() do
      %{"detour_id" => detour.id}
      |> __MODULE__.new(
        scheduled_at: detour.autoclose_on,
        replace: [
          scheduled: [:scheduled_at],
          available: [:scheduled_at]
        ]
      )
      |> Oban.insert()
    else
      {:ok, nil}
    end
  end
end
