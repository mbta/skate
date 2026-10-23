defmodule Skate.Radio.SQS.Constants do
  @moduledoc false

  @type queue_name :: :commands | :events

  @doc """
  Canonical list of queue names.

  ## Examples

      iex> Skate.Radio.SQS.Constants.queue_names()
      [:commands, :events]
  """
  @spec queue_names() :: [queue_name()]
  def queue_names, do: [:commands, :events]

  @type command_name :: :noop

  @doc """
  Canonical list of command names.

  ## Examples

      iex> Skate.Radio.SQS.Constants.command_names()
      [:noop]
  """
  @spec command_names() :: [command_name()]
  def command_names, do: [:noop]
end
