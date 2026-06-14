#!/bin/sh
set -e

# Substitute only $PORT in the nginx template; leave nginx $variables untouched.
envsubst '$PORT' < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
