# geojson.io

FROM dockerfile/nodejs

RUN apt-get install git python build-essential wget curl -y
RUN mkdir /root/geojson.io
ADD . /root/geojson.io
RUN cd /root/geojson.io && npm install && npm install -g serve && make
RUN echo '#!/bin/bash' > /root/start.sh && \
    echo 'cd /root/geojson.io && serve -p 8080 --no-less' >> /root/start.sh && \
    chmod 755 /root/start.sh

CMD ["/root/start.sh"]

EXPOSE 8080

