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
import sys
import setuptools.command.install
import setuptools.command.develop
import setuptools.command.sdist
from distutils.core import Command
from setuptools import setup, find_packages
from setuptools.command.test import test as test_command
import omero_figure.utils as utils

VERSION = utils.__version__

DESCRIPTION = "OMERO figure creation app"
AUTHOR = "The Open Microscopy Team"
LICENSE = "AGPL-3.0"
HOMEPAGE = "https://github.com/ome/omero-figure"


cmdclass = {}


class PyTest(test_command):
    user_options = [
        ('test-path=', 't', "base dir for test collection"),
        ('test-ice-config=', 'i',
         "use specified 'ice config' file instead of default"),
        ('test-pythonpath=', 'p', "prepend 'pythonpath' to PYTHONPATH"),
        ('test-marker=', 'm', "only run tests including 'marker'"),
        ('test-no-capture', 's', "don't suppress test output"),
        ('test-failfast', 'x', "Exit on first error"),
        ('test-verbose', 'v', "more verbose output"),
        ('test-quiet', 'q', "less verbose output"),
        ('junitxml=', None, "create junit-xml style report file at 'path'"),
        ('pdb', None, "fallback to pdb on error"),
        ]

    def initialize_options(self):
        test_command.initialize_options(self)
        self.test_pythonpath = None
        self.test_string = None
        self.test_marker = None
        self.test_path = 'test'
        self.test_failfast = False
        self.test_quiet = False
        self.test_verbose = False
        self.test_no_capture = False
        self.junitxml = None
        self.pdb = False
        self.test_ice_config = None

    def finalize_options(self):
        test_command.finalize_options(self)
        self.test_args = [self.test_path]
        if self.test_string is not None:
            self.test_args.extend(['-k', self.test_string])
        if self.test_marker is not None:
            self.test_args.extend(['-m', self.test_marker])
        if self.test_failfast:
            self.test_args.extend(['-x'])
        if self.test_verbose:
            self.test_args.extend(['-v'])
        if self.test_quiet:
            self.test_args.extend(['-q'])
        if self.junitxml is not None:
            self.test_args.extend(['--junitxml', self.junitxml])
        if self.pdb:
            self.test_args.extend(['--pdb'])
        self.test_suite = True
        if 'ICE_CONFIG' not in os.environ:
            os.environ['ICE_CONFIG'] = self.test_ice_config

    def run_tests(self):
        if self.test_pythonpath is not None:
            sys.path.insert(0, self.test_pythonpath)
        # import here, cause outside the eggs aren't loaded
        import pytest
        errno = pytest.main(self.test_args)
        sys.exit(errno)


cmdclass['test'] = PyTest


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
        self.spawn(['grunt', 'copy:shapeEditor'])


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
      tests_require=['pytest'],
      )
