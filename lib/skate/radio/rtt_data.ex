defmodule Skate.Radio.RttData do
  @moduledoc """
  Runtime contract for JSON-ready frontend `RttCall` data.

  Required fields must be strings. Optional string fields are omitted when nil;
  response fields also allow explicit nil. Timestamps are strings on the wire,
  matching the frontend's `Date | string` type without imposing a date format.
  """

  @call_types %{emergency: "Emergency", prtt: "PRTT", rtt: "RTT"}
  @rtt_statuses %{unassigned: "unassigned", active: "active", done: "done"}

  @required_fields ~w(id vehicleId receivedAt)
  @optional_fields ~w(talkGroup routeId routeName garage direction variant currentLocation operatorBadge operatorName runNumber adherence)
  @nullable_fields ~w(respondedBy answeredAt markedDoneAt)
  @call_type_values Map.values(@call_types)
  @rtt_status_values Map.values(@rtt_statuses)

  @type t :: %{required(String.t()) => String.t() | nil}
  @type error :: {:invalid_field, String.t()}
  @type call_type :: :emergency | :prtt | :rtt

  @spec call_type(call_type()) :: String.t()
  def call_type(type), do: Map.fetch!(@call_types, type)

  @spec default_call_type() :: String.t()
  def default_call_type, do: call_type(:rtt)

  @spec default_status() :: String.t()
  def default_status, do: @rtt_statuses.active

  @doc """
  Validates mapped call data without coercing values or filling required fields.

  Returns the original map on success, or the first invalid field.
  """
  @spec validate(map()) :: {:ok, t()} | {:error, error()}
  def validate(data) when is_map(data) do
    with :ok <- validate_fields(@required_fields, &is_binary(data[&1])),
         :ok <-
           validate_fields(@optional_fields ++ @nullable_fields, fn field ->
             is_nil(data[field]) or is_binary(data[field])
           end),
         :ok <- validate_inclusion(data, "callType", @call_type_values),
         :ok <- validate_inclusion(data, "status", @rtt_status_values) do
      {:ok, data}
    end
  end

  defp validate_fields(fields, valid?) do
    case Enum.find(fields, &(not valid?.(&1))) do
      nil -> :ok
      field -> {:error, {:invalid_field, field}}
    end
  end

  defp validate_inclusion(data, field, allowed) do
    if data[field] in allowed,
      do: :ok,
      else: {:error, {:invalid_field, field}}
  end
end
