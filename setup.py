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
import setuptools.command.install
import setuptools.command.develop
import setuptools.command.sdist
from distutils.core import Command
from setuptools import setup, find_packages
import omero_figure.utils as utils

VERSION = utils.__version__

d = utils.read_file('package.json', 'json')
DESCRIPTION = d['description']
AUTHOR = d['author']
LICENSE = d['license']
HOMEPAGE = d['homepage']


cmdclass = {}


class NpmInstall(Command):

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        self.spawn(['npm', 'install'])


cmdclass['npm_install'] = NpmInstall


class Grunt(Command):

    sub_commands = [
        ('npm_install', None)
    ]

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        if not os.path.isdir('src'):
            return
        for command in self.get_sub_commands():
            self.run_command(command)

        self.spawn(['grunt', 'jst'])
        self.spawn(['grunt', 'concat'])
        self.spawn(['grunt', 'jshint', '--force'])


cmdclass['grunt'] = Grunt


class Sdist(setuptools.command.sdist.sdist):

    def run(self):
        if os.path.isdir('src'):
            self.run_command('grunt')
        setuptools.command.sdist.sdist.run(self)


cmdclass['sdist'] = Sdist


class Install(setuptools.command.install.install):

    def run(self):
        if os.path.isdir('src'):
            self.run_command('grunt')
        setuptools.command.install.install.run(self)


cmdclass['install'] = Install


class Develop(setuptools.command.develop.develop):

    sub_commands = setuptools.command.develop.develop.sub_commands + [
        ('grunt', None)
    ]

    def run(self):
        if os.path.isdir('src'):
            for command in self.get_sub_commands():
                self.run_command(command)
        setuptools.command.develop.develop.run(self)


cmdclass['develop'] = Develop


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
          'Programming Language :: Python :: 2',
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
      install_requires=[],
      include_package_data=True,
      zip_safe=False,
      cmdclass=cmdclass,
      )
