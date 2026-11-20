defmodule Skate.Radio.RttData do
  @moduledoc """
  Runtime contract for JSON-ready frontend `RttCall` data.

  Required fields must be strings. Optional string fields are omitted when nil;
  response fields also allow explicit nil. Timestamps are strings on the wire,
  matching the frontend's `Date | string` type without imposing a date format.
  """

  @call_types %{emergency: "Emergency", prtt: "PRTT", rtt: "RTT"}
  @rtt_statuses %{unassigned: "unassigned", active: "active", done: "done"}

  @required_fields ~w(id routeId routeName vehicleId receivedAt)
  @optional_fields ~w(talkGroup garage direction variant currentLocation operatorBadge operatorName runNumber adherence)
  @nullable_fields ~w(respondedBy answeredAt markedDoneAt)

  @type t :: %{required(String.t()) => String.t() | nil}
  @type errors :: %{required(String.t()) => String.t()}
  @type call_type :: :emergency | :prtt | :rtt

  @spec call_type(call_type()) :: String.t()
  def call_type(type), do: Map.fetch!(@call_types, type)

  @spec default_call_type() :: String.t()
  def default_call_type, do: call_type(:rtt)

  @spec default_status() :: String.t()
  def default_status, do: @rtt_statuses.active

  @doc """
  Validates mapped call data without coercing values or filling required fields.

  Returns a normalized map on success, or errors keyed by frontend field name.
  """
  @spec validate(map()) :: {:ok, t()} | {:error, errors()}
  def validate(data) when is_map(data) do
    errors =
      Enum.reduce(@required_fields, %{}, fn field, errors ->
        if is_binary(data[field]), do: errors, else: Map.put(errors, field, "must be a string")
      end)

    errors =
      Enum.reduce(@optional_fields ++ @nullable_fields, errors, fn field, errors ->
        if is_nil(data[field]) or is_binary(data[field]),
          do: errors,
          else: Map.put(errors, field, "must be a string")
      end)

    errors =
      Enum.reduce(
        [{"callType", Map.values(@call_types)}, {"status", Map.values(@rtt_statuses)}],
        errors,
        fn {field, allowed}, errors ->
          if data[field] in allowed,
            do: errors,
            else: Map.put(errors, field, "must be one of #{Enum.join(allowed, ", ")}")
        end
      )

    if map_size(errors) == 0 do
      fields = @required_fields ++ @optional_fields ++ @nullable_fields ++ ~w(callType status)

      normalized =
        data
        |> Map.take(fields)
        |> Map.reject(fn {field, value} -> field in @optional_fields and is_nil(value) end)

      {:ok, normalized}
    else
      {:error, errors}
    end
  end
end
