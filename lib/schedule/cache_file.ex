defmodule Schedule.CacheFile do
  @moduledoc """
  This module holds the logic for loading and saving cache files
  in dev and test environments with the goal of decreasing startup
  time so devs can work more quickly.

  If GTFS data changes, the cache files should be deleted/removed
  to allowing caching of the changes.
  """
  require Logger

  alias Schedule.Data

  @directory Path.join([File.cwd!(), "priv/schedule_cache"])

  @doc """
  The application should use the file to load data for GTFS
  if the the envs are :dev or :test.

    iex> Mix.env
    :test
    iex> CacheFile.should_use_file?
    true
  """
  @spec should_use_file?() :: boolean
  def should_use_file? do
    cache_filename() != nil
  end

  @doc """
  Attempt to load a cache file.

  This will attempt to load a cache file in dev and test. It will fail
  if the Mix.env is not dev or test, it will fail if the file does not exist
  and it will fail if the loaded term is not a map (minimal validation).

  The validation for loading this file must be appended in later code. No
  such validator currently exists.
  """
  @spec load_gtfs() :: {:ok, Data.t()} | {:error, atom}
  def load_gtfs() do
    Logger.info(fn -> "Loading gtfs cache from default path" end)

    cache_filename()
    |> generate_filepath()
    |> load_gtfs()
  end

  @spec load_gtfs(String.t()) :: {:ok, Data.t()} | {:error, atom}
  def load_gtfs(filepath) when is_binary(filepath) do
    Logger.info(fn -> "Loading gtfs cache from file #{filepath}" end)

    with {:ok, binary_cache} <- File.read(filepath),
         {:ok, data} when is_map(data) <- binary_to_term(binary_cache) do
      Logger.info(fn -> "Loaded gtfs cache from file #{filepath}" end)
      {:ok, data}
    else
      _ ->
        Logger.info(fn -> "Failed to load gtfs cache from file #{filepath}" end)
        {:error, :cache_not_loaded}
    end
  end

  @doc """
  Attempt to save a cache file.
  """
  @spec save_gtfs(Data.t()) :: :ok | {:error, any}
  def save_gtfs(%Data{} = data) do
    filename = cache_filename()

    if is_binary(filename) do
      filepath = generate_filepath(filename)
      Logger.info(fn -> "Saving gtfs cache to file #{filepath}" end)
      save_gtfs(data, filepath)
    else
      {:error, :cache_file_not_saved}
    end
  end

  @spec save_gtfs(Data.t(), String.t()) :: :ok | {:error, any}
  def save_gtfs(data, filepath) when is_map(data) and is_binary(filepath) do
    bin = :erlang.term_to_binary(data)
    File.write(filepath, bin)
  end

  def save_gtfs(_, _) do
    {:error, :cache_file_not_saved}
  end

  @doc """
  The environment specific filepath (path and file name) or nil.
  """
  @spec cache_filename() :: String.t() | nil
  def cache_filename() do
    Application.get_env(:skate, __MODULE__)[:cache_filename]
  end

  @doc """
  Given a filename generates a filepath for saving cache info file.
  """
  @spec generate_filepath(String.t()) :: String.t()
  def generate_filepath(filename) when is_binary(filename) do
    Path.join([@directory, filename])
  end

  @spec binary_to_term(binary()) :: {:ok, term()} | {:error, atom}
  # sobelow_skip ["Misc.BinToTerm"]
  defp binary_to_term(bin) do
    try do
      {:ok, :erlang.binary_to_term(bin)}
    rescue
      ArgumentError ->
        {:error, :invalid_erlang_term_binary}
    end
  end
end
