defmodule Concentrate.TestHelpers do
  @moduledoc """
  Helper functions used by multiple test cases.
  """

  def fixture_path(path) do
    fixture_path = Path.expand("./fixtures", __DIR__)
    Path.expand(path, fixture_path)
  end
end
