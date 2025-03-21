defmodule Swiftly.API.ServiceAdjustmentsTest do
  use ExUnit.Case

  @mock_client_module Swiftly.API.MockClient

  setup_all do
    Mox.defmock(@mock_client_module, for: Swiftly.API.Client)

    :ok
  end

  @default_arguments [
    client: @mock_client_module,
    base_url: URI.parse("https://localhost"),
    agency: "fake-agency",
    api_key: "fake-api-key"
  ]
end
