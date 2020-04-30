# The one the elixir image was built with
FROM alpine:3.9

RUN apk add --update bash \
	&& rm -rf /var/cache/apk

# Install curl so we can query for our instance ID
RUN apk add --no-cache --update curl

# Install coreutils so we can call df to get disk space (through Erlang os_mon)
RUN apk add --no-cache --update coreutils

WORKDIR /root

# Set exposed ports
EXPOSE 4000
ENV PORT=4000 MIX_ENV=prod TERM=xterm LANG=C.UTF-8 REPLACE_OS_VARS=true

ADD . rel/skate
RUN mkdir /root/work

WORKDIR /root/work

CMD ["/root/rel/skate/bin/startup", "start"]
