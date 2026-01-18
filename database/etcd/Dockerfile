FROM quay.io/coreos/etcd:v3.5.16 AS etcd-bin

FROM debian:bookworm-slim AS runtime

LABEL maintainer="area-team"
LABEL version="1.0"
LABEL description="etcd for Patroni cluster coordination"

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    useradd -r -s /bin/false -u 1000 etcd

COPY --from=etcd-bin /usr/local/bin/etcd /usr/local/bin/etcd
COPY --from=etcd-bin /usr/local/bin/etcdctl /usr/local/bin/etcdctl

RUN mkdir -p /etcd-data && chown etcd:etcd /etcd-data

WORKDIR /etcd-data

USER etcd

EXPOSE 2379 2380

CMD ["/usr/local/bin/etcd"]
