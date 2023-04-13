defmodule Skate.RemoveUsersWithoutEmailTest do
  use Skate.DataCase
  import Skate.Factory
  alias Skate.Settings.Db.User

  describe "run/0" do
    test "deletes only the users with missing email addresses" do
      %{id: user_nil_id} = Skate.Repo.insert!(build(:user, %{email: nil}))

      %{id: user_blank_id} = Skate.Repo.insert!(build(:user, %{email: ""}))

      %{id: user_good_id} = Skate.Repo.insert!(build(:user))
      Skate.RemoveUsersWithoutEmail.run()

      assert nil === Skate.Repo.get(User, user_nil_id)
      assert nil === Skate.Repo.get(User, user_blank_id)
      assert %{id: ^user_good_id} = Skate.Repo.get(User, user_good_id)
    end
  end
end
