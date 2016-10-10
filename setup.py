#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2016 University of Dundee.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# Author: Aleksandra Tarkowska <A(dot)Tarkowska(at)dundee(dot)ac(dot)uk>,
#
# Version: 1.0


import os
import json
from setuptools import setup, find_packages


# Utility function to read the README file. Also support json content
def read_file(fname, content_type=None):
    dir_path = os.path.dirname(os.path.realpath(__file__))
    p = os.path.join(dir_path, fname)
    with open(p) as f:
        if content_type in ('json',):
            data = json.load(f)
        else:
            data = f.read()
    return data

VERSION = read_file('package.json', content_type='json')['version']

setup(name="omero-figure",
      packages=find_packages(exclude=['ez_setup']),
      version=VERSION,
      description="A Python plugin for OMERO.web",
      long_description=read_file('README.rst'),
      author='The Open Microscopy Team',
      author_email='ome-devel@lists.openmicroscopy.org.uk',
      license='AGPLv3',
      url="https://github.com/ome/omero-figure",
      download_url='https://github.com/ome/omero-figure/tarball/%s' % VERSION,
      keywords=['OMERO.web', 'figure'],
      install_requires=[],
      include_package_data=True,
      zip_safe=False,
      )
