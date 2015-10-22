FROM node:4.2

RUN adduser figure
COPY . /home/figure/src
RUN chown -R figure /home/figure/src
USER figure
WORKDIR /home/figure/src

RUN npm install
RUN npm install grunt-cli
RUN $(npm bin)/grunt demo

WORKDIR /home/figure/src/demo
CMD ["python", "-m", "SimpleHTTPServer"]
