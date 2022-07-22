Not sure why this is markdown, but at least it's possible to write some notes

# useful Linux commands

## changing between text and gui
```
sudo systemctl set-default multi-user.target

sudo systemctl set-default graphical.target
```

***

## autologin:
```
sudo systemctl edit getty@tty1
```
place these lines in the temporary file editor:
```
[Service]
ExecStart=
ExecStart=-/sbin/agetty -o '-p -f nano' -a nano --noclear %I $TERM
```

***

## connecting to wifi and configuring static ip
connect to the network
```
iwconfig wlan0 essid WIFI_NETWORK_HERE key PASSWORD_HERE
```
then find the gateway
```
route -n
```
configure static ip
```
sudo vim /etc/network/interfaces
```
then change the file to this:
```
auto eth0
iface eth0 inet static 
  address 192.168.0.151
  netmask 255.255.255.0
  gateway GATEWAY IP HERE
  dns-nameservers GATEWAY IP HERE
  dns-nameservers 4.4.4.4
  dns-nameservers 8.8.8.8
```

***

##