defmodule Report.UserInfo do
  @moduledoc """
  Returns usernames, emails, IDs, and UUIDs for mapping to monitoring
  tools like Google Analytics and our own logging.
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
           "id" => u.id,
           "username" => u.username,
           "uuid" => u.uuid,
           "email" => u.email
         }
       )
     )}
  end

  @impl Report
  def short_name(), do: "user_info"

  @impl Report
  def description(), do: "User info"
end
