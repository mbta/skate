# 3. Use MQTT to publish Trip Modifications

Date: 2024-07-04

## Status

Accepted

## Context

We need to send [GTFS Trip Modifications](https://gtfs.org/realtime/feed-entities/trip-modifications/)
to Transit Data.

## Decision

To minimize the amount of resources used and latency between Skate publishing or
un-publishing a Trip Modification and Transit Data becoming aware, we are going
to use MQTT to form an event stream between Skate and Transit Data.

Since this is an output of Skate, we will not make this service required to do
local development.

### Alternatives Considered

#### Polling based alternatives
1. HTTP API

    We considered delivering this information by way of an API that
    Transit Data could poll. That would have the benefit of allowing
    us to "render straight from the database" and avoid any sort of
    expiration/synchronization logic with an external service.
    Additionally, it is already an established practice within Transit
    Data to poll an API (Ex: `Concentrate` polls `RTR`).

    This might be an appropriate choice if we expected there to be
    more "writes" than "reads" -- that is, if we expected officials to
    be modifying detours more frequently than Transit Data would be
    querying them. But we actually expect many more "reads" than
    "writes" - we'll need to access this data any time a rider looks
    up a bus route, or any time an operator loads turn-by-turn
    directions, or possibly once per second, while writes will only
    happen a few times a week, when an official is creating or
    modifying a detour. Creating an API would create performance
    concerns that messaging wouldn't.

    Additionally, Skate's current access control mechanism is
    concerned entirely with _users_ and not providing pragmatic
    access. Using an external service allows us to push authentication
    for this access to other services and IaC instead of requiring
    that Skate also concerns itself with these issues.

2. S3

    [Paul Swartz suggested "[...] if the data isn't updating frequently, S3 is 
    still a good option."](https://www.notion.so/Detours-Transit-Data-Skate-8f39df3d5601437b81a657efdad270c4?d=fabf76c1c0b24acf9f3bb93f7c019dec&pvs=4#b0b68315daf2449ea39582cf2463841b)  
    We considered S3 and decided that it wasn't a good match due to having the
    same complexity of introducing a new service as MQTT and also requiring
    logic to manage old trip modifications, without the benefit of lower latency
    from an event based method.[^ps-1]

#### Event based alternatives
3. AWS Kinesis

    We briefly considered Kinesis because we had thought that MQTT might not
    have a method for catching new subscribers up to speed on any existing Trip
    Modifications, which is a requirement because "Concentrate doesn't currently
    have a mechanism for maintaining state". Upon learning that MQTT has
    `retained` messages, we opted for MQTT due to Kinesis being proprietary.


## Consequences

Since we'll be adding a new technology and service to Skate, there will be more
surface area to test.

By using a message queue, we risk sending events out of order and
having inaccurate ordering of data, we'll need to be careful to address these
issues as they arise during implementation.

[^ps-1]:
    In this comment [Paul Swartz mentioned that using MQTT but sending all
    messages using `retain` will effectively be the same as uploading to S3, but
    with lower latency to clients](https://app.asana.com/0/0/1207124404105396/1207386033651835/f).
