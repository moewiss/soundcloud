FROM serversideup/php:8.4-fpm-nginx

USER root

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip && \
    pip3 install yt-dlp --break-system-packages && \
    rm -rf /var/lib/apt/lists/*

USER www-data
