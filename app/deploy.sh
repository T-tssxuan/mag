#!/bin/bash
until `node app`; do
    echo 'the node down'
done
