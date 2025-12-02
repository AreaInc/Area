FROM postgres:17

ENV DEBIAN_FRONTEND=noninteractive

COPY patroni.yml.template /patroni.yml.template

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       patroni python3-etcd python3-psycopg2 python3-dnspython ca-certificates curl gettext-base \
  && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

CMD ["patroni", "/patroni.yml"]
