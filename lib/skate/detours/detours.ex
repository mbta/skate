defmodule Skate.Detours.Detours do
  @moduledoc """
  The Detours.Db context.
  """

  import Ecto.Query, warn: false
  alias Skate.Detours.Detour.ActivatedDetourDetails
  alias Skate.Repo
  alias Skate.Detours.Db.Detour
  alias Skate.Detours.SnapshotSerde
  alias Skate.Detours.Detour.Detailed, as: DetailedDetour
  alias Skate.Detours.Detour.WithState, as: DetourWithState
  alias Skate.Settings.{TestGroup, User}
  alias Skate.Settings.Db.User, as: DbUser
  require Logger

  @doc """
  Returns the list of detours with author, sorted by updated_at

  ## Examples

      iex> list_detours()
      [%Detour{}, ...]
  """
  def list_detours do
    Repo.all(Skate.Detours.Db.Detour.Queries.select_detour_list_info())
  end

  def list_detours(fields) do
    Skate.Detours.Db.Detour.Queries.select_fields(fields)
    |> Skate.Detours.Db.Detour.Queries.sorted_by_last_updated()
    |> Repo.all()
  end

  @doc """
  Returns the list of detours by route id with author, sorted by updated_at

  ## Examples

      iex> active_detours_by_route()
      [%Detour{}, ...]
  """
  def active_detours_by_route(route_id) do
    Skate.Detours.Db.Detour.Queries.select_detour_list_info()
    |> where([detour: d], d.status == :active)
    |> Repo.all()
    |> Enum.filter(fn detour ->
      detour.route_id == route_id
    end)
    |> Enum.map(&db_detour_to_detour/1)
  end

  def detours_for_user(user_id, status) do
    Skate.Detours.Db.Detour.Queries.select_detour_list_info()
    |> apply_user_and_status_filter(user_id, status)
    |> Repo.all()
    |> Enum.map(&db_detour_to_detour/1)
    |> Enum.reject(&is_nil/1)
  end

  defp apply_user_and_status_filter(query, user_id, :draft) do
    where(query, [detour: d], d.status == :draft and d.author_id == ^user_id)
  end

  defp apply_user_and_status_filter(query, _user_id, status) do
    where(query, [detour: d], d.status == ^status)
  end

  @spec db_detour_to_detour(Detour.t()) :: DetailedDetour.t() | ActivatedDetourDetails.t() | nil
  def db_detour_to_detour(
        %{
          status: :active,
          activated_at: activated_at,
          estimated_duration: estimated_duration
        } = db_detour
      )
      when estimated_duration != nil do
    details = DetailedDetour.from(:active, db_detour)

    details &&
      %ActivatedDetourDetails{
        activated_at: activated_at,
        estimated_duration: estimated_duration,
        details: details
      }
  end

  def db_detour_to_detour(
        %{
          status: :active,
          activated_at: activated_at,
          state: %{"context" => %{"selectedDuration" => estimated_duration}}
        } = db_detour
      ) do
    details = DetailedDetour.from(:active, db_detour)

    details &&
      %ActivatedDetourDetails{
        activated_at: activated_at,
        estimated_duration: estimated_duration,
        details: details
      }
  end

  def db_detour_to_detour(%{status: status} = db_detour) do
    DetailedDetour.from(status, db_detour)
  end

  @spec get_detour_route_id(detour :: map()) :: String.t()
  defp get_detour_route_id(%{state: %{"context" => %{"route" => %{"id" => route_id}}}}),
    do: route_id

  @doc """
  Gets a single detour.

  Raises `Ecto.NoResultsError` if the Detour does not exist.

  ## Examples

      iex> get_detour!(123)
      %Detour{}

      iex> get_detour!(456)
      ** (Ecto.NoResultsError)

  """
  def get_detour!(id), do: Repo.get!(Detour, id)

  @doc """
  Gets a single detour.

  Returns `nil` if the Detour does not exist.

  Raises `ArgumentError` if `id` is `nil`

  ## Examples

      iex> get_detour(123)
      %Detour{}

      iex> get_detour(456)
      nil

      iex> get_detour(nil)
      ** (ArgumentError)

  """
  def get_detour(id), do: Repo.get(Detour, id)

  @doc """
  Gets a single detour authored by the provided user_id.

  Raises `Ecto.NoResultsError` if the Detour does not exist.

  ## Examples

      iex> get_detour_for_user!(123, 123)
      %Detour{}

      iex> get_detour_for_user!(456, 123)
      ** (Ecto.NoResultsError)

  """
  def get_detour_for_user!(id, user_id), do: Repo.get_by!(Detour, id: id, author_id: user_id)

  @doc """
  Gets a single detour with state intact.

  Raises `Ecto.NoResultsError` if the Detour does not exist.

  ## Examples

      iex> get_detour_with_state!(123)
      %DetourWithState{}

      iex> get_detour_with_state!(456)
      ** (Ecto.NoResultsError)

  """
  @spec get_detour_with_state!(integer()) :: DetourWithState.t()
  def get_detour_with_state!(id) do
    detour =
      (detour in Skate.Detours.Db.Detour)
      |> from(where: detour.id == ^id, preload: [:author])
      |> Repo.one!()

    %DetourWithState{
      state: SnapshotSerde.serialize(detour),
      updated_at: timestamp_to_unix(detour.updated_at),
      author: detour.author.email
    }
  end

  @doc """
  Update or insert a detour given a user id and a XState Snapshot.
  """
  def upsert_from_snapshot(author_id, %{} = snapshot) do
    detour_changeset = Skate.Detours.SnapshotSerde.deserialize(author_id, snapshot)

    detour_db_result =
      Skate.Repo.insert(
        detour_changeset,
        returning: true,
        conflict_target: [:id],
        on_conflict: {:replace_all_except, [:inserted_at]}
      )

    case detour_db_result do
      {:ok, %Detour{} = new_record} ->
        handle_detour_updated(detour_changeset, new_record, author_id)

      _ ->
        nil
    end

    detour_db_result
  end

  defp handle_detour_updated(changeset, new_record, author_id) do
    broadcast_detour(new_record, author_id)
    process_notifications(changeset, new_record)
    update_swiftly(changeset, new_record)
  end

  @spec delete_draft_detour(Detour.t(), DbUser.id()) :: :ok
  def delete_draft_detour(detour, author_id) do
    author_uuid =
      author_id
      |> User.get_by_id!()
      |> Map.get(:uuid)

    {:ok, _} = delete_detour(detour)

    Phoenix.PubSub.broadcast(
      Skate.PubSub,
      "detours:draft:" <> author_uuid,
      {:draft_detour_deleted, detour.id}
    )
  end

  @spec broadcast_detour(Detour.t(), DbUser.id()) :: :ok
  defp broadcast_detour(%Detour{status: :draft} = detour, author_id) do
    author_uuid =
      author_id
      |> User.get_by_id!()
      |> Map.get(:uuid)

    Phoenix.PubSub.broadcast(
      Skate.PubSub,
      "detours:draft:" <> author_uuid,
      {:detour_drafted, db_detour_to_detour(detour)}
    )
  end

  defp broadcast_detour(%Detour{status: :active} = detour, author_id) do
    author_uuid =
      author_id
      |> User.get_by_id!()
      |> Map.get(:uuid)

    route_id = get_detour_route_id(detour)

    Phoenix.PubSub.broadcast(
      Skate.PubSub,
      "detours:draft:" <> author_uuid,
      {:detour_activated, db_detour_to_detour(detour)}
    )

    Phoenix.PubSub.broadcast(
      Skate.PubSub,
      "detours:active:" <> route_id,
      {:detour_activated, db_detour_to_detour(detour)}
    )

    Phoenix.PubSub.broadcast(
      Skate.PubSub,
      "detours:active",
      {:detour_activated, db_detour_to_detour(detour)}
    )
  end

  defp broadcast_detour(%Detour{status: :past} = detour, _author_id) do
    route_id = get_detour_route_id(detour)

    Phoenix.PubSub.broadcast(
      Skate.PubSub,
      "detours:active:" <> route_id,
      {:detour_deactivated, db_detour_to_detour(detour)}
    )

    Phoenix.PubSub.broadcast(
      Skate.PubSub,
      "detours:active",
      {:detour_deactivated, db_detour_to_detour(detour)}
    )

    Phoenix.PubSub.broadcast(
      Skate.PubSub,
      "detours:past",
      {:detour_deactivated, db_detour_to_detour(detour)}
    )
  end

  defp process_notifications(
         %Ecto.Changeset{
           data: %Detour{status: :draft},
           changes: %{status: :active}
         },
         %Detour{} = detour
       ) do
    Notifications.Notification.create_activated_detour_notification_from_detour(detour)

    %ActivatedDetourDetails{estimated_duration: estimated_duration} = db_detour_to_detour(detour)
    expires_at = calculate_expiration_timestamp(detour, estimated_duration)

    Skate.Detours.NotificationScheduler.detour_activated(detour, expires_at)
  end

  defp process_notifications(
         %Ecto.Changeset{
           data: %Detour{status: :active},
           changes: %{status: :past}
         },
         %Detour{} = detour
       ) do
    Notifications.Notification.create_deactivated_detour_notification_from_detour(detour)
    Skate.Detours.NotificationScheduler.detour_deactivated(detour)
  end

  defp process_notifications(
         %Ecto.Changeset{
           data: %Detour{
             status: :active,
             state: %{"context" => %{"selectedDuration" => previous_duration}}
           },
           changes: %{state: %{"context" => %{"selectedDuration" => selected_duration}}}
         },
         %Detour{} = detour
       )
       when previous_duration != selected_duration do
    %ActivatedDetourDetails{estimated_duration: estimated_duration} = db_detour_to_detour(detour)
    expires_at = calculate_expiration_timestamp(detour, estimated_duration)

    Skate.Detours.NotificationScheduler.detour_duration_changed(detour, expires_at)
  end

  defp process_notifications(_, _), do: nil

  defp test_group_enabled?() do
    case TestGroup.get_by_name("send-detours-to-swiftly-enabled") do
      %TestGroup{override: :enabled} -> true
      _ -> false
    end
  end

  defp update_swiftly(changeset, detour) do
    update_swiftly_fn = fn -> update_swiftly(changeset, detour, test_group_enabled?()) end

    case update_swiftly_fn.() do
      # retry once on error
      {:error, _} -> update_swiftly_fn.()
      response -> response
    end
  end

  defp update_swiftly(
         %Ecto.Changeset{
           data: %Detour{status: :draft},
           changes: %{status: :active}
         },
         %Detour{} = detour,
         true
       ) do
    {:ok, adjustment_request} = Swiftly.API.Requests.to_swiftly(detour)

    service_adjustments_module().create_adjustment_v1(
      adjustment_request,
      build_swiftly_opts()
    )
  end

  defp update_swiftly(
         %Ecto.Changeset{
           data: %Detour{status: :active},
           changes: %{status: :past}
         },
         %Detour{} = detour,
         true
       ) do
    service_adjustments_module = service_adjustments_module()

    case service_adjustments_module.get_adjustments_v1(build_swiftly_opts()) do
      {:ok, adjustments_response} ->
        adjustment_id =
          adjustments_response
          |> Map.get(:adjustments, [])
          |> Enum.filter(fn adjustment ->
            Map.get(adjustment, :notes) == Integer.to_string(detour.id)
          end)
          |> Enum.map(fn adjustment -> Map.get(adjustment, :id) end)
          |> Enum.at(0)

        if adjustment_id do
          service_adjustments_module.delete_adjustment_v1(adjustment_id, build_swiftly_opts())
        else
          {:error, :not_found}
        end

      {:error, _} = error ->
        error
    end
  end

  defp update_swiftly(_, _, _), do: :ok

  def sync_swiftly_with_skate(
        adjustments_module \\ service_adjustments_module(),
        enabled? \\ test_group_enabled?()
      )

  def sync_swiftly_with_skate(adjustments_module, enabled?) do
    do_sync_swiftly_with_skate(adjustments_module, enabled?)
  end

  defp do_sync_swiftly_with_skate(_adjustments_module, false), do: :ok

  defp do_sync_swiftly_with_skate(adjustments_module, true) do
    skate_detour_ids =
      Skate.Detours.Db.Detour.Queries.select_detour_list_info()
      |> where([detour: d], d.status == :active)
      |> Repo.all()
      |> Enum.map(fn detour -> detour.id end)
      |> MapSet.new()

    swiftly_adjustments =
      case adjustments_module.get_adjustments_v1(
             Keyword.put(build_swiftly_opts(), :adjustmentTypes, "DETOUR_V0")
           ) do
        {:ok, adjustments_response} ->
          Map.get(adjustments_response, :adjustments, [])

        _ ->
          []
      end

    swiftly_adjustments_map =
      swiftly_adjustments
      |> Enum.filter(fn adjustment ->
        notes = Map.get(adjustment, :notes) || ""

        adjustment.feedId == service_adjustments_feed_id() and
          case Integer.parse(notes, 10) do
            :error ->
              Logger.warning(
                "invalid_adjustment_note id=#{adjustment.id} notes=#{inspect(adjustment.notes)}"
              )

              false

            _ ->
              true
          end
      end)
      |> Map.new(fn adjustment ->
        {String.to_integer(adjustment.notes), adjustment}
      end)

    swiftly_detour_ids =
      swiftly_adjustments_map
      |> Map.keys()
      |> MapSet.new()

    extra_in_swiftly =
      swiftly_detour_ids |> MapSet.difference(skate_detour_ids) |> MapSet.to_list()

    if length(extra_in_swiftly) > 0 do
      Enum.each(extra_in_swiftly, fn extra_detour_id ->
        adjustment_id =
          swiftly_adjustments_map
          |> Map.get(extra_detour_id)
          |> Map.get(:id)

        if adjustment_id do
          adjustments_module.delete_adjustment_v1(adjustment_id, build_swiftly_opts())
        end
      end)
    end

    missing_in_swiftly =
      skate_detour_ids |> MapSet.difference(swiftly_detour_ids) |> MapSet.to_list()

    if length(missing_in_swiftly) > 0 do
      Enum.map(missing_in_swiftly, fn missing_detour_id ->
        create_in_swiftly(missing_detour_id, adjustments_module)
      end)
    end
  end

  def get_swiftly_adjustments(adjustments_module \\ service_adjustments_module()) do
    case adjustments_module.get_adjustments_v1(
           Keyword.put(build_swiftly_opts(), :adjustmentTypes, "DETOUR_V0")
         ) do
      {:ok, adjustments_response} ->
        adjustments_response
        |> Map.get(:adjustments, [])
        |> Enum.filter(fn adjustment -> adjustment.feedId == service_adjustments_feed_id() end)

      _ ->
        []
    end
  end

  def get_swiftly_adjustment_for_detour(
        detour_id,
        adjustments_module \\ service_adjustments_module()
      ) do
    swiftly_adjustments = get_swiftly_adjustments(adjustments_module)

    Enum.find(swiftly_adjustments, fn adjustment ->
      notes = Map.get(adjustment, :notes) || ""

      adjustment.feedId == service_adjustments_feed_id() and
        case Integer.parse(notes, 10) do
          :error ->
            Logger.warning(
              "invalid_adjustment_note id=#{adjustment.id} notes=#{inspect(adjustment.notes)}"
            )

            false

          {_parsed_note, _} ->
            notes == detour_id
        end
    end)
  end

  def delete_in_swiftly(detour_id, adjustments_module \\ service_adjustments_module()) do
    swiftly_adjustment = get_swiftly_adjustment_for_detour(detour_id, adjustments_module)

    if swiftly_adjustment do
      adjustments_module.delete_adjustment_v1(
        Map.get(swiftly_adjustment, :id),
        build_swiftly_opts()
      )
    else
      Logger.warning("swiftly adjustment not found")
    end
  end

  def create_in_swiftly(detour_id, adjustments_module \\ service_adjustments_module()) do
    detour = get_detour!(detour_id)

    {:ok, adjustment_request} = Swiftly.API.Requests.to_swiftly(detour)

    adjustments_module.create_adjustment_v1(
      adjustment_request,
      build_swiftly_opts()
    )
  end

  defp build_swiftly_opts() do
    Application.get_env(:skate, Swiftly.API.ServiceAdjustments)
  end

  defp service_adjustments_module() do
    Application.get_env(:skate, :swiftly)[:adjustments_module]
  end

  defp service_adjustments_feed_id() do
    build_swiftly_opts()[:feed_id]
  end

  @doc """
  Deletes a detour.

  ## Examples

      iex> delete_detour(detour)
      {:ok, %Detour{}}

      iex> delete_detour(detour)
      {:error, %Ecto.Changeset{}}

  """
  def delete_detour(%Detour{} = detour) do
    Repo.delete(detour)
  end

  @doc """
  Deletes all detours.
  """
  def delete_all_detours() do
    Repo.delete_all(Detour)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking detour changes.

  ## Examples

      iex> change_detour(detour)
      %Ecto.Changeset{data: %Detour{}}

  """
  def change_detour(%Detour{} = detour, attrs \\ %{}) do
    Detour.changeset(detour, attrs)
  end

  # Converts the db timestamp to unix
  defp timestamp_to_unix(db_date) do
    db_date
    |> DateTime.from_naive!("Etc/UTC")
    |> DateTime.to_unix()
  end

  defp calculate_expiration_timestamp(%{status: :active} = detour, estimated_duration),
    do: do_calculate_expiration_timestamp(detour, estimated_duration)

  defp calculate_expiration_timestamp(_, _), do: nil

  defp do_calculate_expiration_timestamp(
         _detour,
         "Until further notice"
       ) do
    nil
  end

  defp do_calculate_expiration_timestamp(
         detour,
         "Until end of service"
       ) do
    {:ok, eos_same_day} =
      detour.activated_at
      |> DateTime.shift_zone!("America/New_York")
      |> DateTime.to_date()
      |> DateTime.new(~T[03:00:00], "America/New_York")

    # check to see if the activated_at timestamp is after the current date's end of service time for the previous date.
    days_to_add =
      if DateTime.diff(detour.activated_at, eos_same_day) > 0 do
        1
      else
        0
      end

    detour.activated_at
    |> Date.add(days_to_add)
    |> DateTime.new!(~T[03:00:00], "America/New_York")
  end

  defp do_calculate_expiration_timestamp(
         detour,
         n_hours
       )
       when is_binary(n_hours) do
    hours =
      n_hours
      |> String.split()
      |> Enum.at(0)
      |> String.to_integer()

    detour
    |> Map.get(:activated_at)
    |> DateTime.add(hours, :hour)
  end
end
