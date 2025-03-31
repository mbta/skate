defmodule Swiftly.API.ServiceAdjustments do
  @moduledoc """
  Provides API endpoints related to controller

  https://swiftly-inc.stoplight.io/docs/service-adjustments/a6a0871d5c7a5-swiftly-service-adjustments
  """
  require Logger

  @default_client Swiftly.API.Client

  @doc """
  https://swiftly-inc.stoplight.io/docs/service-adjustments/10cf60084522d-create-adjustment

  Create adjustment

  Create a new adjustment

  ## Options

    * `agency`: Agency ID

  """
  @spec create_adjustment_v1(
          Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1.t(),
          keyword
        ) ::
          {:ok, Swiftly.API.ServiceAdjustments.AdjustmentIdResponse.t()}
          | {:error, :bad_request | :unknown}
  def create_adjustment_v1(body, opts \\ []) do
    client = fetch_client(opts)

    params =
      opts
      |> assert_agency_param!()
      |> Keyword.take([:agency])

    %HTTPoison.Request{
      method: :post,
      url: fetch_base_url(opts) |> URI.append_path("/adjustments") |> URI.to_string(),
      params: params,
      body:
        body
        |> add_feed_info_from_opts(opts)
        |> Jason.encode!(),
      headers: [
        "content-type": "application/json",
        authorization: fetch_api_key(opts),
        accept: "application/json"
      ]
    }
    |> client.request()
    |> case do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Jason.decode!(body, keys: :atoms!)}

      {:ok, %HTTPoison.Response{status_code: 400, body: body, request_url: request_url}} ->
        Logger.error("status_code=400 request_url=#{inspect(request_url)} body=#{inspect(body)}")
        {:error, :bad_request}

      response ->
        Logger.error("unknown response=#{inspect(response)}")
        {:error, :unknown}
    end
  end

  defp add_feed_info_from_opts(body, opts) do
    opts
    |> Keyword.take([:feedId, :feedName])
    |> Enum.into(%{})
    |> Map.merge(body, fn
      :feedId, opt_value, nil -> opt_value
      :feedName, opt_value, nil -> opt_value
      _key, _left, body_value -> body_value
    end)
  end

  @doc """
  https://swiftly-inc.stoplight.io/docs/service-adjustments/4e09fdd538867-delete-adjustment

  Delete adjustment

  Delete an existing adjustment. The adjustment will be marked with obsolete = DELETED and given an obsoleteTime and endTime of the current time.

  ## Options

    * `agency`: Agency ID
    * `feedId`: Feed ID the created the adjustment, required if the adjustment is feed-managed.

  """
  @spec delete_adjustment_v1(Swiftly.Api.ServiceAdjustments.AdjustmentId.t(), keyword) ::
          :ok | {:error, :bad_request | :not_found | :unknown}
  def delete_adjustment_v1(adjustment_id, opts \\ []) do
    client = fetch_client(opts)

    params =
      opts
      |> assert_agency_param!()
      |> Keyword.take([:agency, :feedId])

    %HTTPoison.Request{
      method: :delete,
      url:
        fetch_base_url(opts)
        |> URI.append_path("/adjustments/#{adjustment_id}")
        |> URI.to_string(),
      params: params,
      headers: [
        authorization: fetch_api_key(opts),
        accept: "application/json"
      ]
    }
    |> client.request()
    |> case do
      {:ok, %HTTPoison.Response{status_code: 204}} ->
        :ok

      {:ok, %HTTPoison.Response{status_code: 400, body: body, request_url: request_url}} ->
        Logger.error("status_code=400 request_url=#{inspect(request_url)} body=#{inspect(body)}")
        {:error, :bad_request}

      {:ok, %HTTPoison.Response{status_code: 404, body: body, request_url: request_url}} ->
        Logger.error("status_code=404 request_url=#{inspect(request_url)} body=#{inspect(body)}")
        {:error, :not_found}

      response ->
        Logger.error("unknown response=#{inspect(response)}")
        {:error, :unknown}
    end
  end

  @doc """
  https://swiftly-inc.stoplight.io/docs/service-adjustments/ce4a36c183f5f-list-adjustments

  List adjustments

  List adjustments meeting the criteria in the query params. In addition to the parameters marked required below, either `activeAfter` and `activeBefore` or `createdAfter` and `createdBefore` must be given.

  ## Options

    * `agency`: Agency ID
    * `activeAfter`: Filter to adjustments active after this ISO time string (inclusive). Either `activeAfter` and `activeBefore` or `createdAfter` and `createdBefore` must be given.
    * `activeBefore`: Filter to adjustments active before this ISO time string (exclusive). Either `activeAfter` and `activeBefore` or `createdAfter` and `createdBefore` must be given.
    * `createdAfter`: Filter to adjustments created after this ISO time string (inclusive). Either `activeAfter` and `activeBefore` or `createdAfter` and `createdBefore` must be given.
    * `createdBefore`: Filter to adjustments created before this ISO time string (exclusive). Either `activeAfter` and `activeBefore` or `createdAfter` and `createdBefore` must be given.
    * `validOnly`: Filter out invalid adjustments. Parameter is deprecated and validityStates should be used instead. Parameter will only used if validityStates is not included and is treated as false if omitted
    * `validityStates`: Filter to adjustments of these validity states
    * `includeDeleted`: Include deleted adjustments. Parameter is treated as false if omitted
    * `includeAllVersions`: Include all versions of adjustments, including deleted and edited versions. Parameter is treated as false if omitted
    * `adjustmentTypes`: Filter to adjustments of these types
    * `userId`: Filter to adjustment versions created by a certain user. If includeAllVersions is false, this means filter to adjustments last edited by the user

  """
  @spec get_adjustments_v1(keyword) ::
          {:ok, Swiftly.API.ServiceAdjustments.AdjustmentsResponseV1.t()}
          | {:error, :bad_request | :unknown}
  def get_adjustments_v1(opts \\ []) do
    client = fetch_client(opts)

    params =
      opts
      |> assert_agency_param!()
      |> Keyword.take([
        :agency,
        :activeAfter,
        :activeBefore,
        :adjustmentTypes,
        :createdAfter,
        :createdBefore,
        :includeAllVersions,
        :includeDeleted,
        :userId,
        :validOnly,
        :validityStates
      ])
      |> Enum.map(fn
        {key, value} when key in [:adjustmentTypes, :validityStates] and is_list(value) ->
          {key, Jason.encode!(value)}

        {:createdBefore = key, %DateTime{} = value} ->
          {key, DateTime.to_iso8601(value)}

        keyword ->
          keyword
      end)

    %HTTPoison.Request{
      method: :get,
      url: fetch_base_url(opts) |> URI.append_path("/adjustments") |> URI.to_string(),
      params: params,
      headers: [
        authorization: fetch_api_key(opts),
        accept: "application/json"
      ]
    }
    |> client.request()
    |> case do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Jason.decode!(body, keys: :atoms!)}

      {:ok, %HTTPoison.Response{status_code: 400, body: body, request_url: request_url}} ->
        Logger.error("status_code=400 request_url=#{inspect(request_url)} body=#{inspect(body)}")
        {:error, :bad_request}

      response ->
        Logger.error("unknown response=#{inspect(response)}")
        {:error, :unknown}
    end
  end

  defp fetch_client(opts), do: opts[:client] || @default_client

  defp fetch_api_key(opts), do: Keyword.fetch!(opts, :api_key)

  defp fetch_base_url(opts), do: %URI{} = Keyword.fetch!(opts, :base_url)

  defp assert_agency_param!(opts) do
    _ = Keyword.fetch!(opts, :agency)

    opts
  end
end
