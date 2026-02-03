FROM alpine:3.20

RUN apk add --no-cache ca-certificates unzip wget

WORKDIR /app

# Hardcoded PocketBase version for safety
RUN wget -O /tmp/pb.zip https://github.com/pocketbase/pocketbase/releases/download/v0.34.2/pocketbase_0.34.2_linux_amd64.zip \
  && unzip /tmp/pb.zip -d /app \
  && rm /tmp/pb.zip \
  && chmod +x /app/pocketbase

VOLUME ["/pb_data"]
EXPOSE 8080

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb_data"]
