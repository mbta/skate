defmodule Skate.Settings.User do
  alias Skate.Settings.Db.User, as: DbUser

  import Ecto.Query
  require Logger

  @spec get(String.t()) :: DbUser.t()
  @doc """
  Get a user by their username
  """
  def get(username) do
    Skate.Repo.get_by!(DbUser, username: username)
  end

  @spec get_by_email(String.t()) :: DbUser.t() | nil
  @doc """
  Get a user with the matching email, if one exists
  """
  def get_by_email(email) do
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
  Update the user with the given username if one exists, otherwise insert a new one.
  """
  def upsert(username, email) do
    email = String.downcase(email)
    user_matching_email = get_by_email(email)

    user =
      cond do
        is_nil(user_matching_email) ->
          Skate.Repo.insert!(
            DbUser.changeset(%DbUser{}, %{
              username: username,
              email: email
            }),
            returning: true,
            conflict_target: [:username],
            on_conflict: {:replace, [:email]}
          )

        # existing user has same username - no update needed
        user_matching_email.username == username ->
          user_matching_email

        # username format has changed. Create a new record for this user without an associated email
        # This record will be used only temporarily until user settings are universally fetched by email.
        user_matching_email.username != username ->
          Skate.Repo.insert!(
            DbUser.changeset(%DbUser{}, %{
              username: username
            }),
            returning: true,
            conflict_target: [:username],
            # update a row with no effect so the returning works
            on_conflict: {:replace, [:username]}
          )
      end

    if is_nil(user.uuid) do
      user |> Ecto.Changeset.change(%{uuid: Ecto.UUID.generate()}) |> Skate.Repo.update!()
    else
      user
    end
  end

  def user_ids_for_route_ids(route_ids) do
    Skate.Repo.all(from(u in users_for_route_ids_query(route_ids), select: u.id))
  end

  def usernames_for_route_ids(route_ids) do
    Skate.Repo.all(from(u in users_for_route_ids_query(route_ids), select: u.username))
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
