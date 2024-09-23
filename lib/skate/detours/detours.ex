defmodule Skate.Detours.Detours do
  @moduledoc """
  The Detours.Db context.
  """

  import Ecto.Query, warn: false
  alias Skate.Repo
  alias Skate.Detours.Db.Detour
  alias Skate.Detours.Detour.Detailed, as: DetailedDetour
  alias Skate.Detours.Detour.WithState, as: DetourWithState
  alias Skate.Settings.User

  @doc """
  Returns the list of detours.

  ## Examples

      iex> list_detours()
      [%Detour{}, ...]
  """
  def list_detours do
    Detour
    |> Repo.all()
    |> Repo.preload(:author)
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
      Repo.all(
        from(d in Detour,
          order_by: [desc: d.updated_at]
        )
      )
      |> Enum.map(fn detour -> db_detour_to_detour(detour, user_id) end)
      |> Enum.filter(& &1)
      |> Enum.group_by(fn detour -> detour.status end)

    %{
      active: Map.get(detours, :active),
      draft: Map.get(detours, :draft),
      past: Map.get(detours, :past)
    }
  end

  @spec db_detour_to_detour(Detour.t(), integer() | nil) :: DetailedDetour.t() | nil
  def db_detour_to_detour(
        %{
          state: %{
            "context" => %{
              "route" => %{"name" => route_name, "directionNames" => direction_names},
              "routePattern" => %{"headsign" => headsign, "directionId" => direction_id},
              "nearestIntersection" => nearest_intersection
            }
          }
        } = db_detour,
        user_id
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
      status: categorize_detour(db_detour, user_id)
    }
  end

  def db_detour_to_detour(invalid_detour, _) do
    Sentry.capture_message("Detour error: the detour has an outdated schema",
      extra: %{error: invalid_detour}
    )

    nil
  end

  @type detour_type :: :active | :draft | :past

  @spec categorize_detour(map(), integer()) :: detour_type
  defp categorize_detour(%{state: %{"value" => %{"Detour Drawing" => "Active"}}}, _user_id),
    do: :active

  defp categorize_detour(%{state: %{"value" => %{"Detour Drawing" => "Past"}}}, _user_id),
    do: :past

  defp categorize_detour(_detour_context, nil = _user_id), do: :draft
  defp categorize_detour(%{author_id: author_id}, user_id) when author_id == user_id, do: :draft
  defp categorize_detour(_, _), do: nil

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
      id
      |> get_detour!()
      |> Repo.preload(:author)

    %DetourWithState{
      state: detour.state,
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
  Update or create a detour given a user id & detour id.
  """
  def update_or_create_detour_for_user(user_id, uuid, attrs \\ %{}) do
    user = User.get_by_id!(user_id)

    case uuid do
      nil ->
        create_detour_for_user(user_id, attrs)

      _ ->
        Repo.insert(
          Detour.changeset(%Detour{author: user, id: uuid}, attrs),
          returning: true,
          conflict_target: [:id],
          on_conflict: {:replace, [:state, :updated_at]}
        )
    end
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
