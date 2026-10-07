defmodule SkateWeb.ResearchScenarioChannelTest do
  use SkateWeb.ChannelCase
  import Test.Support.Helpers

  alias Phoenix.Socket
  alias Skate.Research.ScenarioStore
  alias SkateWeb.ResearchScenarioChannel
  alias SkateWeb.UserSocket

  setup do
    reassign_env(:skate, :valid_token_fn, fn _socket -> true end)

    socket = socket(UserSocket, "", %{})

    start_supervised({ScenarioStore, []})
    ScenarioStore.reset_all()

    {:ok, socket: socket}
  end

  describe "join/3" do
    test "joins successfully and returns current scenario for subtopic", %{socket: socket} do
      assert {:ok, %{data: nil}, %Socket{}} =
               subscribe_and_join(
                 socket,
                 ResearchScenarioChannel,
                 "research:scenarios:rtt_queue"
               )
    end

    test "joins and returns existing scenario if already set for that subtopic", %{socket: socket} do
      ScenarioStore.set("rtt_queue", %{"id" => "standard"})

      assert {:ok, %{data: %{"id" => "standard"}}, %Socket{}} =
               subscribe_and_join(
                 socket,
                 ResearchScenarioChannel,
                 "research:scenarios:rtt_queue"
               )
    end

    test "subtopics remain isolated in ScenarioStore", %{socket: socket} do
      ScenarioStore.set("topic_a", %{"id" => "a"})

      assert {:ok, %{data: nil}, %Socket{}} =
               subscribe_and_join(
                 socket,
                 ResearchScenarioChannel,
                 "research:scenarios:topic_b"
               )
    end

    test "returns an error when joining an invalid topic", %{socket: socket} do
      assert {:error, %{message: "no such topic \"research:invalid\""}} =
               subscribe_and_join(socket, ResearchScenarioChannel, "research:invalid")
    end

    test "denies topic subscription when socket token validation fails", %{socket: socket} do
      reassign_env(:skate, :valid_token_fn, fn _socket -> false end)

      assert {:error, %{reason: :not_authenticated}} =
               subscribe_and_join(
                 socket,
                 ResearchScenarioChannel,
                 "research:scenarios:rtt_queue"
               )
    end
  end

  describe "handle_in/3" do
    test "trigger_scenario sets store, broadcasts to subscribers, and replies ok", %{
      socket: socket
    } do
      {:ok, _, socket} =
        subscribe_and_join(socket, ResearchScenarioChannel, "research:scenarios:rtt_queue")

      payload = %{"id" => "stress", "name" => "Stress Test"}
      ref = Phoenix.ChannelTest.push(socket, "trigger_scenario", payload)

      assert_reply(ref, :ok, %{data: ^payload})
      assert_broadcast("scenario_triggered", %{data: ^payload})
      assert ScenarioStore.get("rtt_queue") == payload
    end

    test "reset_scenario resets store for subtopic, broadcasts reset, and replies ok", %{
      socket: socket
    } do
      ScenarioStore.set("rtt_queue", %{"id" => "stress"})

      {:ok, _, socket} =
        subscribe_and_join(socket, ResearchScenarioChannel, "research:scenarios:rtt_queue")

      ref = Phoenix.ChannelTest.push(socket, "reset_scenario", %{})

      assert_reply(ref, :ok)
      assert_broadcast("scenario_reset", %{data: nil})
      assert ScenarioStore.get("rtt_queue") == nil
    end
  end
end
