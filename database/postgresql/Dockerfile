FROM postgres:17

LABEL maintainer="area-team"
LABEL version="1.0"
LABEL description="PostgreSQL with Patroni for high availability"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       patroni python3-etcd python3-psycopg2 python3-dnspython \
       ca-certificates curl gettext-base gosu \
  && rm -rf /var/lib/apt/lists/*

COPY patroni.yml.template /patroni.yml.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

CMD ["patroni", "/patroni.yml"]
