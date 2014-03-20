# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "hashicorp/precise32"

  config.vm.provision "shell", path: "vagrant.sh"

  config.vm.network :forwarded_port, guest: 8080, host: 8080, auto_correct: true
  config.vm.network :private_network, ip: "192.168.50.120"
end
