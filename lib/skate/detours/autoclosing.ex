defmodule Skate.Detours.Autoclosing do
  @moduledoc false

  import Ecto.Query
  alias Skate.Settings.TestGroup
  alias Skate.Detours.Db.Detour

  @spec feature_flag_name() :: atom()
  def feature_flag_name(), do: :detours__autoclosing__pilot

  @spec test_group_name() :: binary()
  def test_group_name(), do: "detours-autoclosing-pilot"

  @spec enabled?() :: boolean()
  def enabled?() do
    with {:ok, "on"} <- Application.fetch_env(:skate, feature_flag_name()),
         %TestGroup{override: :enabled} <- TestGroup.get_by_name(test_group_name()) do
      true
    else
      _ -> false
    end
  end

  @spec calculate_autoclose_on_from_duration(Ecto.Changeset.t()) :: Ecto.Changeset.t()
  def calculate_autoclose_on_from_duration(%Ecto.Changeset{} = changeset) do
    case Ecto.Changeset.fetch_change(changeset, :estimated_duration) do
      {:ok, new_estimated_duration} ->
        Ecto.Changeset.put_change(
          changeset,
          :autoclose_on,
          calculate_autoclose_on(new_estimated_duration)
        )

      _ ->
        changeset
    end
  end

  @spec calculate_autoclose_on(binary() | nil) :: DateTime.t()
  def calculate_autoclose_on(estimated_duration)

  def calculate_autoclose_on(estimated_duration) when is_binary(estimated_duration) do
    estimated_duration_str = String.trim(estimated_duration)

    cond do
      estimated_duration_str in ["Until further notice", "Until end of service"] or
        String.ends_with?(estimated_duration_str, "hour") or
          String.ends_with?(estimated_duration_str, "hours") ->
        "America/New_York"
        |> DateTime.now!()
        |> DateTime.to_date()
        |> Util.Time.end_of_service_in_utc()

      String.match?(estimated_duration_str, ~r/^\d{4}-\d{2}-\d{2}$/) ->
        case Date.from_iso8601(estimated_duration_str) do
          {:ok, date} -> Util.Time.end_of_service_in_utc(date)
          {:error, _} -> nil
        end

      true ->
        nil
    end
  end

  def calculate_autoclose_on(nil), do: nil

  @spec apply_status_filter(Ecto.Queryable.t(), atom()) :: Ecto.Query.t()
  def apply_status_filter(query, status)

  def apply_status_filter(query, :active = _status) do
    now = DateTime.utc_now()

    # Include detours that have been lactivated and are not manually closed.
    # Manually closed means status = :past
    where(
      query,
      [detour: d],
      not is_nil(d.activated_at) and d.status != ^:past and
        (is_nil(d.autoclose_on) or ^now <= d.autoclose_on)
    )
  end

  def apply_status_filter(query, :draft = _status) do
    where(
      query,
      [detour: d],
      is_nil(d.activated_at) or d.status == ^:draft
    )
  end

  def apply_status_filter(query, :past = _status) do
    now = DateTime.utc_now()

    where(
      query,
      [detour: d],
      (^now > d.autoclose_on and not is_nil(d.autoclose_on)) or d.status == ^:past
    )
  end

  def apply_status_filter(query, _status), do: query

  defmodule Job do
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
    def schedule(%Detour{id: id, autoclose_on: autoclose_on} = _activated_detour) do
      if Autoclosing.enabled?() do
        %{detour_id: id}
        |> __MODULE__.new(scheduled_at: autoclose_on)
        |> Oban.insert()
      else
        {:ok, nil}
      end
    end

    @spec reschedule(Detour.t()) ::
            {:ok, Oban.Job.t()} | {:ok, nil} | {:error, Oban.Job.changeset() | term()}
    def reschedule(%Detour{id: id, autoclose_on: autoclose_on} = _updated_detour) do
      if Autoclosing.enabled?() do
        %{"detour_id" => id}
        |> __MODULE__.new(
          scheduled_at: autoclose_on,
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
end
