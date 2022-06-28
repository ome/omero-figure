FROM openmicroscopy/omero-web-standalone:latest

USER root
RUN yum -y install npm
COPY . /home/figure/src

WORKDIR /home/figure/src

RUN npm install -g grunt-cli && npm install grunt --save-dev
RUN $(npm bin)/grunt build
RUN /opt/omero/web/venv3/bin/pip install -e .

USER omero-web
