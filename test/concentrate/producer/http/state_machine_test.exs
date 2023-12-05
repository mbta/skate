defmodule Concentrate.Producer.HTTP.StateMachineTest do
  @moduledoc false
  use ExUnit.Case
  import Concentrate.Producer.HTTP.StateMachine
  import ExUnit.CaptureLog

  setup_all do
    Application.ensure_all_started(:bypass)
    Application.ensure_all_started(:httpoison)
    :ok
  end

  describe "url/1" do
    test "returns the URL for the machine" do
      machine = init("url", parser: &List.wrap/1)
      assert url(machine) == "url"
    end

    test "returns the main URL if the fallback is inactive" do
      machine = init("url", fallback_url: "other url", parser: &List.wrap/1)
      assert url(machine) == "url"
    end

    @tag :capture_log
    test "returns the fallback URL if active" do
      messages = [
        {:http_response, make_resp([])},
        fn -> :timer.sleep(5) end,
        # activates fallback
        {:http_response, make_resp(code: 304)},
        {:fallback, {:http_response, make_resp(body: "fallback")}}
      ]

      assert {machine, _, _} =
               run_machine(
                 "url",
                 [content_warning_timeout: 5, fallback_url: "other url"],
                 messages
               )

      assert url(machine) == "other url"
    end
  end

  describe "fetch/1" do
    test "fetches immediately the first time" do
      machine = init("url", parser: &List.wrap/1)
      assert {_machine, [], [{_, 0}]} = fetch(machine)
    end

    test "if we had a success in the past, doesn't refetch immediately" do
      machine = init("url", parser: &List.wrap/1)
      {machine, _, _} = message(machine, {:http_response, make_resp([])})
      assert {_machine, _, [{_, delay}]} = fetch(machine)
      assert delay > 0
    end

    test "if we had a success more than `fetch_after` in the past, fetches immediately" do
      machine = init("url", fetch_after: 10, parser: &List.wrap/1)
      {machine, _, _} = message(machine, {:http_response, make_resp([])})
      :timer.sleep(11)
      assert {_machine, _, [{_, 0}]} = fetch(machine)
    end
  end

  describe "decode_body/2" do
    test "decodes a gzipped body if that is the encoding" do
      headers =
        Enum.shuffle([
          {"ETag", "hello"},
          {"Content-Encoding", "gzip"}
        ])

      body = "body"
      encoded_body = :zlib.gzip(body)
      assert decode_body(headers, encoded_body) == body
    end

    test "defaults to not decoding" do
      headers = [{"ETag", "hello"}]
      body = "body"
      assert decode_body(headers, body) == body
    end
  end

  describe "message/2" do
    test "does not log an error on :closed or :timeout errors" do
      machine = init("url", parser: &List.wrap/1)

      for reason <- [:closed, {:closed, :timeout}, :timeout] do
        error = {:http_error, reason}

        log =
          capture_log([level: :error], fn ->
            assert {_machine, [], [{{:fetch, _}, _}]} = message(machine, error)
          end)

        assert log == ""
      end
    end

    test "does not log an error on :ssl_closed errors" do
      machine = init("url", parser: &List.wrap/1)

      error = {:ssl_closed, :closed}

      log =
        capture_log([level: :error], fn ->
          assert {_machine, [], _} = message(machine, error)
        end)

      assert log == ""
    end

    test "does log other errors" do
      machine = init("url", parser: &List.wrap/1)
      error = {:http_error, :unknown_error}

      log =
        capture_log([level: :error], fn ->
          assert {_machine, [], [{{:fetch, _}, _}]} = message(machine, error)
        end)

      assert log =~ ":unknown_error"
    end

    test "logs a warning if we have't gotten content since a timeout" do
      opts = [content_warning_timeout: 1]

      messages = [
        {:http_response, make_resp(body: "body")},
        fn -> :timer.sleep(5) end,
        {:http_response, make_resp(code: 304)}
      ]

      log =
        capture_log([level: :warning], fn ->
          _ = run_machine("url", opts, messages)
        end)

      assert log =~ ~s(url="url")
      assert log =~ "feed has not been updated"
    end

    test "logs a warning if we haven't gotten records (post-parse) since a timeout" do
      opts = [content_warning_timeout: 1, parser: fn _ -> [] end]

      messages = [
        {:http_response, make_resp(body: "body")},
        fn -> :timer.sleep(5) end,
        {:http_response, make_resp(body: "body 2")}
      ]

      log =
        capture_log([level: :warning], fn ->
          _ = run_machine("url", opts, messages)
        end)

      assert log =~ ~s(url="url")
      assert log =~ "feed has not been updated"
    end

    test "does not log multiple warnings after the first timeout" do
      opts = [content_warning_timeout: 5]

      messages = [
        {:http_response, make_resp(body: "body")},
        {:http_response, make_resp(code: 304)},
        fn -> :timer.sleep(10) end,
        {:http_response, make_resp(code: 304)}
      ]

      log =
        capture_log([level: :warning], fn ->
          _ = run_machine("url", opts, messages)
        end)

      # only one message (some content before, some content after)
      assert [_, _] = String.split(log, "[warning]")
    end

    test "logs a warning if we never receive content before the timeout" do
      opts = [content_warning_timeout: 5]

      messages = [
        fn -> :timer.sleep(6) end,
        {:http_response, make_resp(code: 404)}
      ]

      log =
        capture_log([level: :warning], fn ->
          _ = run_machine("url", opts, messages)
        end)

      refute log == ""
    end

    test "receiving the same body twice does not send a second message" do
      messages = [
        {:http_response, make_resp(body: "body")},
        {:http_response, make_resp(body: "body")}
      ]

      {_machine, bodies, messages} = run_machine("url", [], messages)

      assert bodies == []
      assert [{{:fetch, "url"}, timeout} | _] = messages
      assert timeout > 0
    end

    test "receiving an unknown code logs an warning and reschedules a fetch" do
      messages = [
        {:http_response, make_resp(code: 500)}
      ]

      fetch_after = 1000

      log =
        capture_log([level: :warning], fn ->
          assert {_machine, [], [{{:fetch, "url"}, ^fetch_after} | _]} =
                   run_machine("url", [fetch_after: fetch_after], messages)
        end)

      refute log == ""
    end

    @tag :capture_log
    test "timing out with a fallback URL requests that URL" do
      messages = [
        {:http_response, make_resp([])},
        fn -> :timer.sleep(5) end,
        # activates fallback
        {:http_response, make_resp(code: 304)}
      ]

      assert {machine, [], [normal_fetch, fallback_fetch]} =
               run_machine(
                 "url",
                 [content_warning_timeout: 5, fallback_url: "other url"],
                 messages
               )

      assert normal_fetch == {{:fetch, "url"}, machine.fetch_after}
      # fallback is fetched immediately
      assert fallback_fetch == {{:fallback, {:fetch, "other url"}}, 0}
    end

    @tag :capture_log
    test "the parent recovering stops fetching from the fallback" do
      messages = [
        {:http_response, make_resp([])},
        fn -> :timer.sleep(5) end,
        # activates fallback
        {:http_response, make_resp(code: 304)},
        {:http_response, make_resp(body: "body")}
      ]

      assert {machine, [["body"]], _} =
               run_machine(
                 "url",
                 [content_warning_timeout: 5, fallback_url: "other url"],
                 messages
               )

      assert machine.fallback == {:not_active, "other url"}
    end

    @tag :capture_log
    test "fetch triggers the fallback to fetch as well" do
      messages = [
        {:http_response, make_resp([])},
        fn -> :timer.sleep(5) end,
        # activates fallback
        {:http_response, make_resp(code: 304)}
      ]

      {machine, [], _} =
        run_machine("url", [content_warning_timeout: 5, fallback_url: "other url"], messages)

      {_, [], messages} = fetch(machine)

      assert [
               {{:fetch, "url"}, _},
               {{:fallback, {:fetch, "other url"}}, _}
             ] = messages
    end
  end

  defp run_machine(url, opts, messages) do
    opts = Keyword.put_new(opts, :parser, &List.wrap/1)
    machine = init(url, opts)
    initial = {machine, [], []}

    Enum.reduce(messages, initial, fn message, {machine, _, _} ->
      case message do
        fun when is_function(fun, 0) ->
          fun.()
          {machine, [], []}

        message ->
          message(machine, message)
      end
    end)
  end

  defp make_resp(opts) do
    code = Keyword.get(opts, :code, 200)
    body = Keyword.get(opts, :body, "")
    headers = Keyword.get(opts, :headers, [])
    %HTTPoison.Response{status_code: code, body: body, headers: headers}
  end
end
