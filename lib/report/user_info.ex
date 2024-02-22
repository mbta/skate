defmodule Report.UserNamesAndUuids do
  @moduledoc """
  Returns usernames and UUIDs for mapping to monitoring tools like
  Google Analytics.
  """

  import Ecto.Query
  alias Skate.Settings.Db.User, as: DbUser

  @behaviour Report

  @impl Report
  def run() do
    {:ok,
     Skate.Repo.all(
       from(u in DbUser,
         select: %{
           "username" => u.username,
           "uuid" => u.uuid,
           "email" => u.email
         }
       )
     )}
  end

  @impl Report
  def short_name(), do: "user_names_and_uuids"

  @impl Report
  def description(), do: "Usernames and UUIDs"
end
