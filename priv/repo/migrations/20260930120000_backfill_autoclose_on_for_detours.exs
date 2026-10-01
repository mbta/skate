defmodule Skate.Repo.Migrations.BackfillAutocloseOnForDetours do
  use Ecto.Migration

  import Ecto.Query

  @tz_db Tzdata.TimeZoneDatabase

  def up do
    {:ok, _} = Application.ensure_all_started(:tzdata)

    from(d in "detours",
      where: not is_nil(d.estimated_duration) and d.status == "active",
      select: {d.id, d.estimated_duration}
    )
    |> repo().all()
    |> Enum.each(fn (%{id: id, estimated_duration: estimated_duration} = detour) ->
      autoclose_on = calculate_autoclose_on(estimated_duration)

      from(d in "detours", where: d.id == ^id)
      |> repo().update_all(set: [autoclose_on: autoclose_on])

      Skate.Detours.Autoclosing.Job.schedule(%Skate.Detours.Db.Detour{
        detour
        | autoclose_on: autoclose_on
      })
    end)
  end

  def down, do: :ok

  # Inlined copy of Skate.Detours.Autoclosing.calculate_autoclose_on/1 so this
  # migration is unaffected by future changes to application code.
  defp calculate_autoclose_on(estimated_duration) do
    estimated_duration_str = String.trim(estimated_duration)

    cond do
      estimated_duration_str in ["Until further notice", "Until end of service"] or
        String.ends_with?(estimated_duration_str, "hour") or
          String.ends_with?(estimated_duration_str, "hours") ->
        "America/New_York"
        |> DateTime.now!(@tz_db)
        |> DateTime.to_date()
        |> end_of_service_in_utc()

      String.match?(estimated_duration_str, ~r/^\d{4}-\d{2}-\d{2}$/) ->
        case Date.from_iso8601(estimated_duration_str) do
          {:ok, date} -> end_of_service_in_utc(date)
          {:error, _} -> nil
        end

      true ->
        nil
    end
  end

  defp end_of_service_in_utc(date) do
    date
    |> Date.add(1)
    |> DateTime.new!(~T[03:00:00.000000], "America/New_York", @tz_db)
    |> DateTime.shift_zone!("Etc/UTC", @tz_db)
  end
end
