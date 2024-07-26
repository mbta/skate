defmodule Skate.Detours.Detours do
  @moduledoc """
  The Detours.Db context.
  """

  import Ecto.Query, warn: false
  alias Skate.Repo

  alias Skate.Detours.Db.Detour

  @doc """
  Returns the list of detours.

  ## Examples

      iex> list_detours()
      [%Detour{}, ...]

  """
  def list_detours do
    Repo.all(Detour)
  end

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
