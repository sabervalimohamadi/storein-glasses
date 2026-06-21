#!/bin/bash
# اجرا: bash deploy/setup-logrotate.sh

pm2 install pm2-logrotate

pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm

echo "Log rotation configured ✓"
pm2 save
