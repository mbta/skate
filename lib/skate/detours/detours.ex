defmodule Skate.Detours.Detours do
  @moduledoc """
  The Detours.Db context.
  """

  import Ecto.Query, warn: false
  alias Skate.Repo
  alias Skate.Detours.Db.Detour
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
        active: [%Detour{}, ...],
        draft: nil,
        past: [%Detour{}, ...]
      }
  """
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

  @spec db_detour_to_detour(Detour.t(), integer()) :: t()
  defp db_detour_to_detour(
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

    date =
      db_detour.updated_at
      |> DateTime.from_naive!("Etc/UTC")
      |> DateTime.to_unix()

    %__MODULE__{
      route: route_name,
      direction: direction,
      name: headsign,
      intersection: nearest_intersection,
      updated_at: date,
      author_id: db_detour.author_id,
      status: categorize_detour(db_detour, user_id)
    }
  end

  defp db_detour_to_detour(invalid_detour, _) do
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
  Updates a detour.

  ## Examples

      iex> update_detour(detour, %{field: new_value})
      {:ok, %Detour{}}

      iex> update_detour(detour, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_detour(%Detour{} = detour, attrs) do
    detour
    |> Detour.changeset(attrs)
    |> Repo.update()
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
  Returns an `%Ecto.Changeset{}` for tracking detour changes.

  ## Examples

      iex> change_detour(detour)
      %Ecto.Changeset{data: %Detour{}}

  """
  def change_detour(%Detour{} = detour, attrs \\ %{}) do
    Detour.changeset(detour, attrs)
  end
end
