defmodule Concentrate.TestHelpers do
  @moduledoc """
  Helper functions used by multiple test cases.
  """

  def json_from_fixture(filename) do
    filename
    |> fixture_path()
    |> File.read!()
    |> Jason.decode!(strings: :copy)
  end

  def fixture_path(path) do
    fixture_path = Path.expand("./fixtures", __DIR__)
    Path.expand(path, fixture_path)
  end
end
