defmodule Gtfs do
  use GenServer
  require Logger

  @type state :: %{
          stops: [Gtfs.Stop.t()]
        }

  # Client functions

  @spec start_link(String.t()) :: GenServer.on_start()
  def start_link(url) do
    GenServer.start_link(__MODULE__, url)
  end

  # GenServer callbacks

  @impl true
  def init(url) do
    case HTTPoison.get(url) do
      {:ok, %HTTPoison.Response{status_code: 200, body: zip_binary}} ->
        file_list = [
          "stops.txt"
        ]

        unzipped_files = unzip_files(zip_binary, file_list)

        state = %{
          stops: parse_csv(unzipped_files["stops.txt"], &Gtfs.Stop.from_csv_row/1)
        }

        Logger.info(fn -> "Successfully loaded gtfs" end)
        IO.inspect(state, label: :state)
        {:ok, state}

      response ->
        Logger.warn(fn -> "Unexpected response from #{url} : #{inspect(response)}" end)
        {:stop, response}
    end
  end

  # Takes in the binary data of a zip file, and a list of files to extract
  # Returns a map from those file names to the data in each file
  @spec unzip_files(binary(), [String.t()]) :: %{optional(String.t()) => binary()}
  defp unzip_files(zip_binary, file_names) do
    # erlang needs file names as charlists.
    file_names = Enum.map(file_names, &String.to_charlist/1)
    {:ok, unzipped_files} = :zip.unzip(zip_binary, [{:file_list, file_names}, :memory])

    unzipped_files
    # Convert filenames back from charlists to strings
    |> Enum.map(fn {file_name, data} -> {to_string(file_name), data} end)
    |> Map.new()
  end

  @doc """
  Takes binary csv data, and a function to parse each row, and returns the list of results
  The rows will be passed to the parser as maps with string keys and values.
  e.g. %{"col1" => "1", "col2" => "x"}

  iex> Gtfs.parse_csv("col1,col2\\n1,x\\n2,y", fn row -> String.to_integer(row["col1"]) end)
  [1, 2]

  exposed for testing
  """
  @spec parse_csv(binary(), (%{required(String.t()) => String.t()} -> row_struct)) :: [row_struct]
        when row_struct: var
  def parse_csv(file_binary, row_decoder) do
    {:ok, file_stream} =
      file_binary
      |> StringIO.open()

    file_stream
    |> IO.binstream(:line)
    |> CSV.decode(headers: true)
    |> Enum.map(fn {:ok, row} -> row_decoder.(row) end)
  end
end
