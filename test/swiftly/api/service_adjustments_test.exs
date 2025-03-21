defmodule Swiftly.API.ServiceAdjustmentsTest do
  use ExUnit.Case

  @mock_client_module Swiftly.API.MockClient

  setup_all do
    Mox.defmock(@mock_client_module, for: Swiftly.API.Client)

    :ok
  end
end
