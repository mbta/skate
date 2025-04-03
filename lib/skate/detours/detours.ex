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
  alias Skate.Settings.User
  alias Skate.Settings.Db.User, as: DbUser

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
    detour_changes = Skate.Detours.SnapshotSerde.deserialize(author_id, snapshot)

    detour_db_result =
      Skate.Repo.insert(
        detour_changes,
        returning: true,
        conflict_target: [:id],
        on_conflict: {:replace_all_except, [:inserted_at]}
      )

    case detour_db_result do
      {:ok, %Detour{} = new_record} ->
        broadcast_detour(new_record, author_id)
        send_notification(detour_changes, new_record)
        update_swiftly(detour_changes, new_record)

      _ ->
        nil
    end

    detour_db_result
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

  defp send_notification(
         %Ecto.Changeset{
           data: %Detour{status: :draft},
           changes: %{status: :active}
         },
         %Detour{} = detour
       ) do
    Notifications.NotificationServer.detour_activated(detour)
  end

  defp send_notification(
         %Ecto.Changeset{
           data: %Detour{status: :active},
           changes: %{status: :past}
         },
         %Detour{} = detour
       ) do
    Notifications.NotificationServer.detour_deactivated(detour)
  end

  defp send_notification(_, _), do: nil

  defp update_swiftly(
         %Ecto.Changeset{
           data: %Detour{status: :draft},
           changes: %{status: :active}
         },
         %Detour{} = detour
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
         %Detour{} = detour
       ) do
    service_adjustments_module = service_adjustments_module()

    case service_adjustments_module.get_adjustments_v1(build_swiftly_opts()) do
      {:ok, adjustments_response} ->
        adjustments_response
        |> Map.get(:adjustments, [])
        |> Enum.filter(fn adjustment ->
          Map.get(adjustment, :notes) == Integer.to_string(detour.id)
        end)
        |> Enum.map(fn adjustment -> Map.get(adjustment, :id) end)
        |> Enum.at(0)
        |> service_adjustments_module.delete_adjustment_v1(build_swiftly_opts())

      _ ->
        nil
    end
  end

  defp update_swiftly(_, _), do: nil

  defp build_swiftly_opts() do
    Application.get_env(:skate, Swiftly.API.ServiceAdjustments)
  end

  defp service_adjustments_module() do
    Application.get_env(:skate, :swiftly)[:adjustments_module]
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
end
