#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright (c) 2016-2023 University of Dundee.
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
from setuptools.command.build_py import build_py
from setuptools.command.install import install
from setuptools.command.sdist import sdist
from setuptools.command.develop import develop
from setuptools import setup, find_packages
import omero_figure.utils as utils

VERSION = utils.__version__

DESCRIPTION = "OMERO figure creation app"
AUTHOR = "The Open Microscopy Team"
LICENSE = "AGPL-3.0"
HOMEPAGE = "https://github.com/ome/omero-figure"


def require_npm(command, strict=False):
    """
    Decorator to run NPM prerequisites
    """
    class WrappedCommand(command):
        def run(self):
            if strict or not os.path.exists(
                    'omero_figure/templates/omero_figure/index.html'):
                self.spawn(['npm', 'install'])
                self.spawn(['npm', 'run', 'build'])
            command.run(self)
    return WrappedCommand


setup(name="omero-figure",
      packages=find_packages(exclude=['ez_setup']),
      version=VERSION,
      description=DESCRIPTION,
      long_description=utils.read_file('README.rst'),
      classifiers=[
          'Development Status :: 5 - Production/Stable',
          'Environment :: Web Environment',
          'Framework :: Django',
          'Intended Audience :: End Users/Desktop',
          'Intended Audience :: Science/Research',
          'Natural Language :: English',
          'Operating System :: OS Independent',
          'Programming Language :: JavaScript',
          'Programming Language :: Python :: 3',
          'Topic :: Internet :: WWW/HTTP',
          'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
          'Topic :: Internet :: WWW/HTTP :: WSGI',
          'Topic :: Scientific/Engineering :: Visualization',
          'Topic :: Software Development :: Libraries :: '
          'Application Frameworks',
          'Topic :: Text Processing :: Markup :: HTML'
      ],  # Get strings from
          # http://pypi.python.org/pypi?%3Aaction=list_classifiers
      author=AUTHOR,
      author_email='ome-devel@lists.openmicroscopy.org.uk',
      license=LICENSE,
      url=HOMEPAGE,
      download_url='%s/archive/v%s.tar.gz' % (HOMEPAGE, VERSION),
      keywords=['OMERO.web', 'figure'],
      install_requires=['omero-web>=5.6.0'],
      python_requires='>=3',
      include_package_data=True,
      zip_safe=False,
      cmdclass={
        'build_py': require_npm(build_py),
        'install': require_npm(install),
        'sdist': require_npm(sdist, True),
        'develop': require_npm(develop),
      },
      tests_require=['pytest'],
      )
