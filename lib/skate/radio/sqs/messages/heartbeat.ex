defmodule Skate.Radio.SQS.Messages.Heartbeat do
  @moduledoc """
  Schema for heartbeat/liveness/readiness messages published to AWS SQS.
  """

  @default_schema_version "2026-10-20"

  @derive Jason.Encoder
  @enforce_keys [:message_identifier, :status, :instance_identifier, :timestamp, :version]
  defstruct [:message_identifier, :status, :instance_identifier, :timestamp, :version]

  @type t :: %__MODULE__{
          message_identifier: String.t(),
          status: String.t(),
          instance_identifier: String.t(),
          timestamp: String.t(),
          version: String.t()
        }

  @doc """
  Constructs a new Heartbeat struct with default values.
  """
  @spec new(Keyword.t()) :: t()
  def new(attributes \\ []) do
    %__MODULE__{
      message_identifier:
        Keyword.get_lazy(attributes, :message_identifier, &Ecto.UUID.generate/0),
      status: Keyword.get(attributes, :status, "ready"),
      instance_identifier:
        Keyword.get_lazy(attributes, :instance_identifier, &default_instance_identifier/0),
      timestamp:
        Keyword.get_lazy(attributes, :timestamp, fn ->
          DateTime.utc_now() |> DateTime.to_iso8601()
        end),
      version: Keyword.get(attributes, :version, @default_schema_version)
    }
  end

  defp default_instance_identifier do
    case System.get_env("HOSTNAME") do
      hostname when is_binary(hostname) and hostname != "" -> hostname
      _ -> to_string(node())
    end
  end
end
