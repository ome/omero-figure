FROM openmicroscopy/omero-web-standalone:5.21.0

USER root
RUN yum -y install npm
COPY . /home/figure/src

WORKDIR /home/figure/src

RUN npm install -g grunt-cli && npm install grunt --save-dev
RUN $(npm bin)/grunt build
RUN /opt/omero/web/venv3/bin/pip install -e .


RUN echo "config set omero.web.application_server development" >> /opt/omero/web/config/01-default-webapps.omero
RUN echo "config set omero.web.debug true" >> /opt/omero/web/config/01-default-webapps.omero
USER omero-web
