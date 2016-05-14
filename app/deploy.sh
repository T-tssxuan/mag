#!/bin/bash
until `node app > log`; do
    echo 'the node down'
done
