defmodule Skate.Settings.RouteSettingsMigrator do
  use GenServer, restart: :transient
  require Logger
  import Ecto.Query

  alias Skate.Repo
  alias Skate.Settings.Db.User, as: DbUser

  @type direction :: :route_settings_to_route_tabs | :route_tabs_to_route_settings

  @impl true
  def init(opts) do
    {:ok, nil, {:continue, opts[:direction]}}
  end

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: opts[:name] || __MODULE__)
  end

  @impl true
  def handle_continue(:route_settings_to_route_tabs, _state) do
    changesets =
      from(u in DbUser)
      |> Repo.all()
      |> Repo.preload([:route_settings, :route_tabs])
      |> Enum.filter(fn db_user -> !is_nil(db_user.route_settings) end)
      |> Enum.filter(fn db_user ->
        route_settings_time =
          db_user.route_settings.updated_at || db_user.route_settings.inserted_at

        route_tabs_time =
          db_user.route_tabs
          |> Enum.map(fn route_tab -> route_tab.updated_at || route_tab.inserted_at end)
          |> Enum.max(fn -> nil end)

        is_nil(route_tabs_time) ||
          NaiveDateTime.compare(route_settings_time, route_tabs_time) in [:gt, :eq]
      end)
      |> Enum.map(fn db_user ->
        route_settings = db_user.route_settings

        DbUser.changeset(db_user, %{
          route_tabs: [
            %{
              uuid: Ecto.UUID.generate(),
              ordering: 0,
              is_current_tab: true,
              selected_route_ids: route_settings.selected_route_ids,
              ladder_directions: route_settings.ladder_directions,
              ladder_crowding_toggles: route_settings.ladder_crowding_toggles
            }
          ]
        })
      end)

    Enum.each(changesets, fn changeset -> Repo.update!(changeset) end)

    Logger.info(
      "#{__MODULE__} migrated #{Enum.count(changesets)} user(s) from route_settings to route_tabs"
    )

    {:stop, :normal, nil}
  end

  def handle_continue(:route_tabs_to_route_settings, _state) do
    changesets =
      from(u in DbUser)
      |> Repo.all()
      |> Repo.preload([:route_settings, :route_tabs])
      |> Enum.filter(fn db_user -> !is_nil(db_user.route_settings) end)
      |> Enum.filter(fn db_user ->
        route_settings_time =
          db_user.route_settings.updated_at || db_user.route_settings.inserted_at

        route_tabs_time =
          db_user.route_tabs
          |> Enum.map(fn route_tab -> route_tab.updated_at || route_tab.inserted_at end)
          |> Enum.max(fn -> nil end)

        !is_nil(route_tabs_time) &&
          NaiveDateTime.compare(route_tabs_time, route_settings_time) in [:gt, :eq]
      end)
      |> Enum.map(fn db_user ->
        ordered_open_route_tabs =
          db_user.route_tabs
          |> Enum.filter(&(!is_nil(&1.ordering)))
          |> Enum.sort_by(& &1.ordering)

        selected_route_ids =
          ordered_open_route_tabs
          |> Enum.map(& &1.selected_route_ids)
          |> List.flatten()
          |> Enum.uniq_by(& &1)

        ladder_directions =
          ordered_open_route_tabs
          |> Enum.map(& &1.ladder_directions)
          |> Enum.reduce(%{}, fn ladder_directions, acc ->
            Map.merge(acc, ladder_directions || %{})
          end)

        ladder_crowding_toggles =
          ordered_open_route_tabs
          |> Enum.map(& &1.ladder_crowding_toggles)
          |> Enum.reduce(%{}, fn ladder_crowding_toggles, acc ->
            Map.merge(acc, ladder_crowding_toggles || %{})
          end)

        DbUser.changeset(db_user, %{
          route_settings: %{
            user_id: db_user.id,
            selected_route_ids: selected_route_ids,
            ladder_directions: ladder_directions,
            ladder_crowding_toggles: ladder_crowding_toggles
          }
        })
      end)

    Enum.each(changesets, fn changeset -> Repo.update!(changeset) end)

    Logger.info(
      "#{__MODULE__} migrated #{Enum.count(changesets)} user(s) from route_tabs to route_settings"
    )

    {:stop, :normal, nil}
  end

  def handle_continue(direction, _state) do
    Logger.error("#{__MODULE__} invalid direction for migration: #{inspect(direction)}")

    {:stop, :invalid_direction, nil}
  end
end
