defmodule Skate.Detours.Detours do
  @moduledoc """
  The Detours.Db context.
  """

  import Ecto.Query, warn: false
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
    (detour in Skate.Detours.Db.Detour)
    |> from(
      preload: [:author],
      order_by: [desc: detour.updated_at]
    )
    |> Repo.all()
  end

  @doc """
  Returns the list of detours by route id with author, sorted by updated_at

  ## Examples

      iex> active_detours_by_route()
      [%Detour{}, ...]
  """
  def active_detours_by_route(route_id) do
    list_detours()
    |> Enum.filter(fn detour ->
      categorize_detour(detour) == :active and get_detour_route_id(detour) == route_id
    end)
    |> Enum.map(fn detour -> db_detour_to_detour(detour) end)
  end

  @doc """
  Returns the detours grouped by active, draft, and past.

  ## Examples

      iex> grouped_detours(my_user_id)
      %{
        active: [%DetailedDetour{}, ...],
        draft: nil,
        past: [%DetailedDetour{}, ...]
      }
  """
  @spec grouped_detours(integer()) :: %{
          active: list(DetailedDetour.t()) | nil,
          draft: list(DetailedDetour.t()) | nil,
          past: list(DetailedDetour.t()) | nil
        }
  def grouped_detours(user_id) do
    detours =
      list_detours()
      |> Enum.map(&db_detour_to_detour/1)
      |> Enum.filter(& &1)
      |> Enum.group_by(fn detour -> detour.status end)

    %{
      active: Map.get(detours, :active, []),
      draft:
        detours
        |> Map.get(:draft, [])
        |> Enum.filter(fn detour -> detour.author_id == user_id end),
      past: Map.get(detours, :past, [])
    }
  end

  @spec db_detour_to_detour(Detour.t()) :: DetailedDetour.t() | nil
  def db_detour_to_detour(
        %{
          state: %{
            "context" => %{
              "route" => %{"name" => route_name, "directionNames" => direction_names},
              "routePattern" => %{"headsign" => headsign, "directionId" => direction_id},
              "nearestIntersection" => nearest_intersection
            }
          }
        } = db_detour
      ) do
    direction = Map.get(direction_names, Integer.to_string(direction_id))

    %DetailedDetour{
      id: db_detour.id,
      route: route_name,
      direction: direction,
      name: headsign,
      intersection: nearest_intersection,
      updated_at: timestamp_to_unix(db_detour.updated_at),
      author_id: db_detour.author_id,
      status: categorize_detour(db_detour)
    }
  end

  def db_detour_to_detour(invalid_detour) do
    Sentry.capture_message("Detour error: the detour has an outdated schema",
      extra: %{error: invalid_detour}
    )

    nil
  end

  @type detour_type :: :active | :draft | :past

  @doc """
  Takes a `Skate.Detours.Db.Detour` struct and a `Skate.Settings.Db.User` id
  and returns a `t:detour_type/0` based on the state of the detour.

  otherwise returns `nil` if it is a draft but does not belong to the provided
  user
  """
  @spec categorize_detour(detour :: map()) :: detour_type()
  def categorize_detour(%{state: %{"value" => %{"Detour Drawing" => %{"Active" => _}}}}),
    do: :active

  def categorize_detour(%{state: %{"value" => %{"Detour Drawing" => "Past"}}}),
    do: :past

  def categorize_detour(_detour_context), do: :draft

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
  Creates a detour.

  ## Examples

      iex> create_detour(%{field: value})
      {:ok, %Detour{}}

      iex> create_detour(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_detour(attrs \\ %{}) do
    %Detour{}
    |> Detour.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates a detour given a user id & detour id.
  """
  def create_detour_for_user(user_id, attrs \\ %{}) do
    user = User.get_by_id!(user_id)

    %Detour{
      author: user
    }
    |> Detour.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update or insert a detour given a user id and a XState Snapshot.
  """
  def upsert_from_snapshot(author_id, %{} = snapshot) do
    previous_record =
      case Skate.Detours.SnapshotSerde.id_from_snapshot(snapshot) do
        nil -> nil
        id -> Skate.Repo.get(Detour, id)
      end

    detour_db_result =
      author_id
      |> Skate.Detours.SnapshotSerde.deserialize(snapshot)
      |> Skate.Repo.insert(
        returning: true,
        conflict_target: [:id],
        on_conflict: {:replace_all_except, [:inserted_at]}
      )

    case detour_db_result do
      {:ok, %Detour{} = new_record} ->
        new_record
        |> categorize_detour()
        |> broadcast_detour(new_record, author_id)

        send_notification(new_record, previous_record)

      _ ->
        nil
    end

    detour_db_result
  end

  @spec broadcast_detour(detour_type(), Detour.t(), DbUser.id()) :: :ok
  defp broadcast_detour(:draft, detour, author_id) do
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

  defp broadcast_detour(:active, detour, author_id) do
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

  defp broadcast_detour(:past, detour, _author_id) do
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

  @doc """
  Retrieves a `Skate.Detours.Db.Detour` from the database by it's ID and then resolves the
  detour's category via `categorize_detour/2`
  """
  @spec categorize_detour_by_id(detour_id :: nil | integer()) :: detour_type() | nil
  def categorize_detour_by_id(nil = _detour_id), do: nil

  def categorize_detour_by_id(detour_id) do
    case Skate.Repo.get(Detour, detour_id) do
      %Detour{} = detour -> categorize_detour(detour)
      _ -> nil
    end
  end

  @spec send_notification(
          new_record :: Skate.Detours.Db.Detour.t() | nil,
          previous_record :: Skate.Detours.Db.Detour.t() | nil
        ) :: :ok | nil
  @spec send_notification(%{
          next_detour: Skate.Detours.Db.Detour.t() | nil,
          next: detour_type() | nil,
          previous: detour_type() | nil
        }) :: :ok | nil
  defp send_notification(
         %Detour{} = new_record,
         %Detour{} = previous_record
       ) do
    send_notification(%{
      next_detour: new_record,
      previous: categorize_detour(previous_record),
      next: categorize_detour(new_record)
    })
  end

  defp send_notification(_, _), do: nil

  defp send_notification(%{
         next: :active,
         next_detour: detour,
         previous: previous_status
       })
       when previous_status != :active do
    Notifications.NotificationServer.detour_activated(detour)
  end

  defp send_notification(%{
         next: :past,
         next_detour: detour,
         previous: previous_status
       })
       when previous_status != :past do
    Notifications.NotificationServer.detour_deactivated(detour)
  end

  defp send_notification(_), do: nil

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
