#!/bin/bash
cd /home/kavia/workspace/code-generation/mobile-phone-and-accessory-shop-management-system-183433/web_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

