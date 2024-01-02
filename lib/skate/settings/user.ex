defmodule Skate.Settings.User do
  @moduledoc false

  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.TestGroup

  import Ecto.Query
  require Logger

  @spec get_by_email(String.t()) :: DbUser.t() | nil
  @doc """
  Get a user with the matching email, if one exists
  """
  def get_by_email(email) when is_binary(email) do
    Skate.Repo.get_by(DbUser, email: String.downcase(email))
  end

  @spec get_by_id(integer()) :: DbUser.t() | nil
  @doc """
  Get a user by ID, if one exists
  """
  def get_by_id(id) do
    Skate.Repo.get(DbUser, id)
  end

  @spec get_by_id!(integer()) :: DbUser.t()
  @doc """
  Get a user by ID or raise an error if none found.
  """
  def get_by_id!(id) do
    Skate.Repo.get!(DbUser, id)
  end

  @spec get_all() :: [DbUser.t()]
  def get_all() do
    Skate.Repo.all(DbUser)
  end

  @spec upsert(username :: String.t(), email :: String.t()) :: DbUser.t()
  @doc """
  Update or create the user with the given email.
  """
  def upsert(username, email) when is_binary(email) and email != "" do
    email = String.downcase(email)

    user =
      case get_by_email(email) do
        nil ->
          # If there isn't an existing user with this email address create a new one.
          # If there is an existing user with the same username, set the email address for that user
          Skate.Repo.insert!(
            DbUser.changeset(%DbUser{}, %{
              username: username,
              email: email
            }),
            returning: true,
            conflict_target: [:username],
            on_conflict: {:replace, [:email]}
          )

        existing_user_with_email ->
          # If there is an existing user with this email, return it without modifying the username
          existing_user_with_email
      end

    if is_nil(user.uuid) do
      user |> Ecto.Changeset.change(%{uuid: Ecto.UUID.generate()}) |> Skate.Repo.update!()
    else
      user
    end
  end

  @spec user_ids_for_route_ids([String.t()]) :: [DbUser.id()]
  def user_ids_for_route_ids(route_ids) do
    Skate.Repo.all(from(u in users_for_route_ids_query(route_ids), select: u.id))
  end

  def is_in_test_group(user_id, test_group_name) do
    user_id
    |> get_by_id!()
    |> all_test_group_names()
    |> Enum.member?(test_group_name)
  end

  def all_test_group_names(user) do
    user = Skate.Repo.preload(user, :test_groups)

    enabled_test_groups = TestGroup.get_override_enabled()

    (enabled_test_groups ++ user.test_groups)
    |> Enum.map(& &1.name)
    |> Enum.dedup()
  end

  defp users_for_route_ids_query(route_ids) do
    from(u in DbUser,
      join: rt in assoc(u, :route_tabs),
      # non-nil ordering means tab is open
      where:
        not is_nil(rt.ordering) and
          fragment("?::varchar[] && ?", ^route_ids, rt.selected_route_ids)
    )
  end
end
