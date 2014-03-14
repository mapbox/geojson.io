#!/bin/bash

apt-get update
apt-get install aptitude htop vim curl wget tmux build-essential -y

if [[ ! -e /usr/bin/npm ]]; then
    cd ~
    wget http://nodejs.org/dist/v0.10.26/node-v0.10.26.tar.gz -O ~/nodejs.tar.gz
    tar -xvf ~/nodejs.tar.gz
    rm nodejs.tar.gz
    mv node* nodejs
    cd nodejs
    ./configure
    make
    make install
    cd ..
    rm nodejs -Rf
    npm install -g serve
fi

if [[ ! -e /vagrant/node_modules ]]; then
    su vagrant -c 'cd /vagrant && npm install && make'
fi

su vagrant -c 'cd /vagrant && npm update'

