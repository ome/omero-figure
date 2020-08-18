---
layout: post
title:  "Dev: Setting up nginx on Mac OSX"
date:   2014-06-12
---


On a recent trip to the University of Sussex to talk about OMERO,
I presented OMERO.figure and it was well recieved. They tried to
install it but they use a different web deployment there,
with everything under an /omero/ prefix. E.g. server/omero/webclient/.

Unfortunately, we had neglegted to test OMERO.figure under these conditions
since our test server in Dundee and my local development server are both
run without any url prefix.

So, the first thing I needed to setup before fixing the bugs was to deploy
my local development OMERO.figure under an /omero/ prefix. It turned out
that the easiest way to do this was to use nginx, which Chris helped me
to setup with the following instructions (which others may find useful).
NB: The proper documentation for this is on the
[OMERO.web deployment docs](https://www.openmicroscopy.org/site/support/omero5/sysadmins/unix/install-web.html)
but this is just what worked for me.
Using homebrew on Mac 10.8:

	$ brew install nginx
	$ dist/bin/omero admin stop
	$ dist/bin/omero web stop
	$ ./build.py clean build
	$ dist/bin/omero admin start
	# you must be using fastcgi-tcp for this example
	$ dist/bin/omero config set omero.web.application_server "fastcgi-tcp"
	$ dist/bin/omero web start
	$ dist/bin/omero web config nginx > omero_nginx.conf


Then apply the omero_nginx.conf.patch below manually. It won't apply directly because
my paths will be different than yours. You may also need to change ports based on
what else you may have running.

	--- omero_nginx.conf.bak	2014-05-06 10:19:48.000000000 +0100
	+++ omero_nginx.conf	2014-05-06 10:20:25.000000000 +0100
	@@ -33,7 +33,7 @@
	             alias /Users/callan/code/ome.git/dist/lib/python/omeroweb/static;
	         }
	 
	-        location / {
	+        location ~ /omero/(.*) {
	             if (-f /Users/callan/code/ome.git/dist/var/maintenance.html) {
	                error_page 503 /maintenance.html;
	                return 503;
	@@ -41,7 +41,8 @@
	 
	             fastcgi_pass 0.0.0.0:4080;
	 
	-            fastcgi_param PATH_INFO $fastcgi_script_name;
	+            fastcgi_param SCRIPT_NAME /omero;
	+            fastcgi_param PATH_INFO /$1;
 
 
	             fastcgi_param REQUEST_METHOD $request_method;


Copy the config to a new 'others' directory in your nginx location:

	$ cd /usr/local/etc/nginx
	$ mkdir others
	$ cp path/to/bin/omero/omero_nginx.conf others/

Then edit the nginx config at /usr/local/etc/nginx/nginx.conf to remove the whole
'server' section:

	server { }

And add the following line, right at the bottom of the http section,
to include the omero_nginx.conf:

    include /usr/local/etc/nginx/others/*.conf;


Then you can start nginx, working off of Django workers which use
dist/lib/python/ on http://localhost:8080/omero/

	$ nginx

	# if you need to stop and restart
	$ nginx -s stop && nginx

Following this, I was able to fix all the issues with OMERO.figure under /omero/figure
and all thse fixes will be in the imminent 1.0.0-beta2 release.


UPDATE: When I first wrote this post, all that I needed to do was run nginx from
the bin/omero directory itself, passing it the config file there:

	nginx -c `pwd`/omero_nginx.conf

But now I'm trying it on a new machine some time later, this fails and I need to
move it within the nginx directory as described above.
