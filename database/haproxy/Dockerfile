FROM haproxy:2.8

LABEL maintainer="area-team"
LABEL version="1.0"
LABEL description="HAProxy for PostgreSQL Patroni cluster load balancing"

COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
