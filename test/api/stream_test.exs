defmodule Api.StreamTest do
  use ExUnit.Case, async: false
  import Test.Support.Helpers
  alias Plug.Conn

  describe "build_options" do
    setup do
      reassign_env(:skate, :api_url, "http://example.com")
      reassign_env(:skate, :api_key, "12345678")
    end

    test "builds the URL and includes api key" do
      opts = Api.Stream.build_options(path: "/vehicles")
      assert Keyword.get(opts, :url) == "http://example.com/vehicles"
      assert <<_::binary>> = Keyword.get(opts, :api_key)
    end
  end

  describe "start_link" do
    setup do
      bypass = Bypass.open()

      {:ok, %{bypass: bypass}}
    end

    test "starts a genserver that sends events", %{bypass: bypass} do
      Bypass.expect(bypass, fn conn ->
        conn = Conn.send_chunked(conn, 200)

        data = %{
          "attributes" => [],
          "type" => "vehicle",
          "id" => "vehicle"
        }

        Conn.chunk(conn, "event: reset\ndata: #{Jason.encode!([data])}\n\n")
        conn
      end)

      assert {:ok, sses} =
               [
                 name: :start_link_test,
                 base_url: "http://localhost:#{bypass.port}",
                 path: "/vehicles",
                 params: [
                   "fields[vehicle]": "direction_id,current_status,longitude,latitude,bearing",
                   include: "stop,trip"
                 ]
               ]
               |> Api.Stream.build_options()
               |> ServerSentEventStage.start_link()

      assert {:ok, pid} = Api.Stream.start_link(name: __MODULE__, subscribe_to: sses)

      assert [%Api.Stream.Event{}] =
               [pid]
               |> GenStage.stream()
               |> Enum.take(1)
    end

    # We're seeing occasional failures in this test due to an underlying issue
    # with the `Bypass` library. There is an
    # [open issue on Bypass's github](https://github.com/PSPDFKit-labs/bypass/issues/120).
    test "handles api events", %{bypass: bypass} do
      Bypass.expect(bypass, fn conn ->
        conn = Conn.send_chunked(conn, 200)

        data = %{
          "attributes" => [],
          "type" => "vehicle",
          "id" => "vehicle"
        }

        {:ok, conn} = Conn.chunk(conn, "event: ignores unexpected events\n\n")
        {:ok, conn} = Conn.chunk(conn, "ignored garbled data\n\n")
        {:ok, conn} = Conn.chunk(conn, "event: reset\ndata: #{Jason.encode!([data])}\n\n")
        {:ok, conn} = Conn.chunk(conn, "event: add\ndata: #{Jason.encode!(data)}\n\n")
        {:ok, conn} = Conn.chunk(conn, "event: update\ndata: #{Jason.encode!(data)}\n\n")
        {:ok, conn} = Conn.chunk(conn, "event: remove\ndata: #{Jason.encode!(data)}\n\n")
        conn
      end)

      assert {:ok, sses} =
               [
                 base_url: "http://localhost:#{bypass.port}",
                 path: "/vehicles"
               ]
               |> Api.Stream.build_options()
               |> ServerSentEventStage.start_link()

      assert {:ok, pid} = Api.Stream.start_link(name: __MODULE__, subscribe_to: sses)

      stream = GenStage.stream([pid])

      assert [
               %Api.Stream.Event{event: :reset},
               %Api.Stream.Event{event: :add},
               %Api.Stream.Event{event: :update},
               %Api.Stream.Event{event: :remove}
             ] = Enum.take(stream, 4)
    end
  end
end
