FROM node:alpine
WORKDIR /usr/src/app

RUN echo 'echo "Hello, World!"' > start.sh
RUN chmod +x start.sh

COPY ./scripts/entrypoint.sh /tmp/entrypoint.sh
RUN chmod 777 /tmp/entrypoint.sh

ENTRYPOINT /tmp/entrypoint.sh

EXPOSE 9092
EXPOSE 5005