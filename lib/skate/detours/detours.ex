defmodule Skate.Detours.Detours do
  @moduledoc """
  The Detours.Db context.
  """

  import Ecto.Query, warn: false
  alias Skate.Repo
  alias Schedule.Gtfs.Direction
  alias Skate.Detours.Db.Detour, as: DbDetour
  alias Skate.Settings.User

  @type t :: %__MODULE__{
          route: String.t(),
          direction: String.t(),
          name: String.t(),
          intersection: String.t(),
          updated_at: integer(),
          author_id: integer(),
          status: :active | :draft | :past
        }

  @derive Jason.Encoder

  defstruct [
    :route,
    :direction,
    :name,
    :intersection,
    :updated_at,
    :author_id,
    :status
  ]

  @doc """
  Returns the list of detours.

  ## Examples

      iex> list_detours()
      [%DbDetour{}, ...]

  """
  def list_detours(user_id) do
    DbDetour
    |> Repo.all()
    |> Enum.map(&db_detour_to_detour(&1, user_id))
  end

  @spec db_detour_to_detour(DbDetour.t(), integer()) :: t()
  defp db_detour_to_detour(
         %{
           state: %{
             "context" => %{
               "route" => %{"name" => route_name},
               "routePattern" => %{"headsign" => headsign, "directionId" => direction_id}
             }
           }
         } = db_detour,
         user_id
       ) do
    direction = Direction.id_to_string(direction_id)

    date =
      db_detour.updated_at
      |> DateTime.from_naive!("America/New_York")
      |> DateTime.to_unix()

    %__MODULE__{
      route: route_name,
      direction: direction,
      name: headsign,
      intersection: "TBD",
      updated_at: date,
      author_id: db_detour.author_id,
      status: categorize_detour(db_detour, user_id)
    }
  end

  @type detour_type :: :active | :draft | :past

  @spec categorize_detour(map(), integer()) :: detour_type
  defp categorize_detour(%{state: %{"value" => %{"Detour Drawing" => "Active"}}}, _user_id),
    do: :active

  defp categorize_detour(%{state: %{"value" => %{"Detour Drawing" => "Past"}}}, _user_id),
    do: :past

  defp categorize_detour(%{author_id: author_id}, user_id) when author_id == user_id, do: :draft
  defp categorize_detour(_, _), do: nil

  @doc """
  Gets a single detour.

  Raises `Ecto.NoResultsError` if the DbDetour does not exist.

  ## Examples

      iex> get_detour!(123)
      %DbDetour{}

      iex> get_detour!(456)
      ** (Ecto.NoResultsError)

  """
  def get_detour!(id), do: Repo.get!(DbDetour, id)

  @doc """
  Creates a detour.

  ## Examples

      iex> create_detour(%{field: value})
      {:ok, %DbDetour{}}

      iex> create_detour(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_detour(attrs \\ %{}) do
    %DbDetour{}
    |> DbDetour.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates a detour given a user id & detour id.
  """
  def create_detour_for_user(user_id, attrs \\ %{}) do
    user = User.get_by_id!(user_id)

    %DbDetour{
      author: user
    }
    |> DbDetour.changeset(attrs)
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
          DbDetour.changeset(%DbDetour{author: user, id: uuid}, attrs),
          returning: true,
          conflict_target: [:id],
          on_conflict: {:replace, [:state, :updated_at]}
        )
    end
  end

  @doc """
  Updates a detour.

  ## Examples

      iex> update_detour(detour, %{field: new_value})
      {:ok, %DbDetour{}}

      iex> update_detour(detour, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_detour(%DbDetour{} = detour, attrs) do
    detour
    |> DbDetour.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a detour.

  ## Examples

      iex> delete_detour(detour)
      {:ok, %DbDetour{}}

      iex> delete_detour(detour)
      {:error, %Ecto.Changeset{}}

  """
  def delete_detour(%DbDetour{} = detour) do
    Repo.delete(detour)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking detour changes.

  ## Examples

      iex> change_detour(detour)
      %Ecto.Changeset{data: %DbDetour{}}

  """
  def change_detour(%DbDetour{} = detour, attrs \\ %{}) do
    DbDetour.changeset(detour, attrs)
  end
end
