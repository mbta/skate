defmodule Gtfs.Helpers.EnvHelper do
  @moduledoc """
  Query ENV settings
  """

  @doc """
  Returns true if mix is loaded. Will return false for releases.

    iex> EnvHelper.mix_is_loaded?()
    true

  """
  def mix_is_loaded? do
    Code.ensure_loaded?(Mix)
  end

  @doc """
  Returns true if the current Mix.env matches the given item else returns false

    iex> EnvHelper.is_env?(:test)
    true

    iex> EnvHelper.is_env?(:other)
    false

  """
  def is_env?(env_name) do
    mix_is_loaded?() && Mix.env() == env_name
  end

  @doc """
  Returns the current Mix.env or nil.

    iex> EnvHelper.env
    :test

  """
  def env do
    if mix_is_loaded?() do
      Mix.env()
    end
  end
end
