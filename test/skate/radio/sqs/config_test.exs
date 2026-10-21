defmodule Skate.Radio.SQS.ConfigTest do
  use ExUnit.Case, async: false

  import Test.Support.Helpers, only: [reassign_env: 3]

  alias Skate.Radio.SQS.Config

  @fake_queue_url "https://sqs.us-east-2.amazonaws.com/123456789012/FakeQueue"

  for url <- [:commands_queue_url, :events_queue_url] do
    describe "#{url}/0" do
      for {scenario, input, expected} <- [
            {"url is valid", @fake_queue_url, {:ok, @fake_queue_url}},
            {"url is invalid", "not a url", :error},
            {"url is missing", nil, :error}
          ] do
        test "returns #{inspect(expected)} when #{scenario}" do
          reassign_env(
            :skate,
            Skate.Radio.SQS.Config,
            Keyword.put([], unquote(url), unquote(input))
          )

          assert unquote(expected) = Kernel.apply(Config, unquote(url), [])
        end
      end
    end
  end
end
