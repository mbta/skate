# Skate Architecture

## Overview

Skate is a web app designed first (but not exclusively) for mobile. It uses Elixir and Phoenix on the server, and a single page React app on the client.

## Data Flow Diagram

![Skate data flow diagram](/documentation/images/skate-data-flow.png)

## Data Sources

Skate is read-only, so it only needs to ingest data and present it. Skate uses two main categories of data: schedule and real-time. Schedule data does not change frequently, so it is ingested once when the app loads, and persists in memory for the duration of the server instance. Real-time data, on the other hand, changes frequently, so these sources are queried at regular intervals.

### Sources of Schedule Data

- GTFS: A public, (mostly) standard data feed. Includes data like routes, stops, and trips.
- HASTUS: A non-standard format export of private data. Includes operator and vehicle schedules.

### Sources of Realtime Data

- Busloc: GTFS-rt data
  - Vehicle updates
    - Driver information
    - TransitMaster route assignments
  - Trip updates
    - Block waivers
- Swiftly: GTFS-rt data
  - Vehicle updates
    - Inferred location information (what stop is the bus approaching)
    - Schedule adherence (On-Time Performance)
    - Headway
    - Trip assignments based on location
- MBTA V3 API: For train locations

## Authentication

Skate's authentication uses Keycloak as a middleman to manage interaction with Active Directory (using federated services). The actual login page the user interacts with is hosted by Active Directory, you use your same username and password as your email. We could someday add levels of authorization using groups in Keycloak and/or Active Directory, but don't at this time.
