defmodule SkateWeb.AuthManagerTest do
  use SkateWeb.ChannelCase
  alias Guardian.Phoenix.Socket
  alias SkateWeb.AuthManager
  alias SkateWeb.UserSocket
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.User

  @username "username1"
  @user_id 1

  describe "subject_for_token/2" do
    test "returns username string" do
      assert {:ok, @username} == AuthManager.subject_for_token(@username, %{})
    end

    test "returns v2 formatted user id when given user struct" do
      assert {:ok, "v2:#{@user_id}"} ==
               AuthManager.subject_for_token(%DbUser{username: @username, id: @user_id}, %{})
    end
  end

  describe "resource_from_claims/2" do
    test "returns user struct when given v2 formatted user id for a user that exists" do
      %{id: user_id} = User.upsert(@username, "email@test.com")

      assert {:ok, %DbUser{username: @username, id: ^user_id}} =
               AuthManager.resource_from_claims(%{
                 "sub" => "v2:#{user_id}"
               })
    end

    test "returns error when given v2 formatted user id for a user that doesn't exist" do
      non_existent_id = 1234

      assert {:error, :user_not_found} =
               AuthManager.resource_from_claims(%{
                 "sub" => "v2:#{non_existent_id}"
               })
    end

    test "returns username as string when given only username" do
      assert {:ok, @username} == AuthManager.resource_from_claims(%{"sub" => @username})
    end
  end

  describe "username_from_socket!/1" do
    test "extracts the username from the given socket's token" do
      {:ok, token, _claims} = AuthManager.encode_and_sign("charlie")

      {:ok, socket} =
        UserSocket
        |> socket("charlie", %{})
        |> Socket.authenticate(AuthManager, token)

      assert(AuthManager.username_from_socket!(socket) == "charlie")
    end
  end

  describe "username_from_resource/1" do
    test "returns username from user struct" do
      assert @username =
               AuthManager.username_from_resource(%DbUser{username: @username, id: @user_id})
    end

    test "returns string when only given username as string" do
      assert @username = AuthManager.username_from_resource(@username)
    end
  end

  describe "claims_access_level/1" do
    test "grants admin access if in the group" do
      assert AuthManager.claims_access_level(%{"groups" => ["skate-admin"]}) == :admin
    end

    test "grants general access if not in the admin group" do
      assert AuthManager.claims_access_level(%{"groups" => ["other-group"]}) == :general
    end

    test "grants general access if no group information present" do
      assert AuthManager.claims_access_level(%{}) == :general
    end
  end

  describe "claims_grant_dispatcher_access?/1" do
    test "grants dispatcher access when in dispatcher group" do
      assert AuthManager.claims_grant_dispatcher_access?(%{"groups" => ["skate-dispatcher"]})
    end

    test "doesn't grant access with nil groups" do
      refute AuthManager.claims_grant_dispatcher_access?(%{"groups" => nil})
    end

    test "doesn't grant access with non-dispatcher groups" do
      refute AuthManager.claims_grant_dispatcher_access?(%{"groups" => ["other-group"]})
    end

    test "doesn't grant access with no group information present" do
      refute AuthManager.claims_grant_dispatcher_access?(%{})
    end
  end
end
