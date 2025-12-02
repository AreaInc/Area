FROM quay.io/coreos/etcd:v3.5.16 AS etcd-bin

FROM debian:bookworm-slim AS final

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean

COPY --from=etcd-bin /usr/local/bin/etcd /usr/local/bin/etcd
COPY --from=etcd-bin /usr/local/bin/etcdctl /usr/local/bin/etcdctl

WORKDIR /etcd-data

EXPOSE 2379 2380

CMD ["/usr/local/bin/etcd"]
