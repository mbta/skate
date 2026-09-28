defmodule Skate.Detours.Autoclosing do
  @moduledoc false

  import Ecto.Query
  alias Skate.Settings.TestGroup

  @spec feature_flag_name() :: atom()
  def feature_flag_name(), do: :detours__autoclosing__pilot

  @spec test_group_name() :: binary()
  def test_group_name(), do: "detours-autoclosing-pilot"

  @spec enabled?() :: boolean()
  def enabled?() do
    with {:ok, "on"} <- Application.fetch_env(:skate, feature_flag_name()),
         %TestGroup{override: :enabled} <- TestGroup.get_by_name(test_group_name()) do
      true
    else
      _ -> false
    end
  end

  @spec apply_status_filter(Ecto.Queryable.t(), atom()) :: Ecto.Query.t()
  def apply_status_filter(query, status)

  def apply_status_filter(query, :active = _status) do
    now = DateTime.utc_now()

    # Include detours that have been activated and are not manually closed.
    # Manually closed means status = :past
    where(
      query,
      [detour: d],
      not is_nil(d.activated_at) and d.status != ^:past and
        (is_nil(d.autoclose_on) or ^now <= d.autoclose_on)
    )
  end

  def apply_status_filter(query, :draft = _status) do
    where(query, [detour: d], is_nil(d.activated_at))
  end

  def apply_status_filter(query, :past = _status) do
    now = DateTime.utc_now()

    where(
      query,
      [detour: d],
      (not is_nil(d.autoclose_on) and ^now > d.autoclose_on) or d.status == ^:past
    )
  end

  def apply_status_filter(query, _status), do: query
end
