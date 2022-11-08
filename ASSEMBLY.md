<div align=center>

![banner](./img/banner.png)

</div>

***

# **Build Guide**

This is the build guide for our 2022 WRO Future Engineers design - Spark Plugs. It is segmented into 11 main steps, with more detailed steps within. It assumes you have necessary tools and miscellaneous materials including but not limited to: M2.5, M3 driver bits, 

## Print Parts

Before starting assembly, be sure to 3D print all of the 3D-printed parts below:
* [Platform](https://github.com/definitely-nobody-is-here/SPARK_Future-Engineers_2022/raw/master/Documentation/CAD/SPARK2022_platform.stl)
* [Camera Mount](https://github.com/definitely-nobody-is-here/SPARK_Future-Engineers_2022/raw/master/Documentation/CAD/SPARK2022_cameramount.stl)
* [Camera LED Clip](https://github.com/definitely-nobody-is-here/SPARK_Future-Engineers_2022/raw/master/Documentation/CAD/SPARK2022_cameraLEDmount.stl)
* [Rear Wheel Rim](https://github.com/definitely-nobody-is-here/SPARK_Future-Engineers_2022/raw/master/Documentation/CAD/SPARK2022_rearwheelrim.stl) (if using the 1 in rubber tires)

You can start building while these are printing.

## Assemble Chassis Kit

Our design is built on top of a [Schumacher Atom 2 S2 GT12 Pan Car Kit](https://www.amainhobbies.com/schumacher-atom-2-s2-1-12-gt12-competition-pan-car-kit-schk179/p1055346). Follow the instructions in the box until the step to attach the bumper, which is omitted in our build. Make sure to replace the stock 64-tooth spur gear with a [78-tooth spur gear](https://www.amazon.com/Kimbrough-Pitch-Spur-Gear-78T/dp/B0006O1QVM). Also, remove one layer of spacers from the front suspension to raise the front ride height (the weight of the added componenents cause the front suspension to sag).

At this point, the car should look like the car on the box, except without wheels or a bumper.

![chassis with modifications](./Documentation/img/build-0.jpg)

*This image is an edited version of a photo of the carbon fiber edition. It's not ours, we just don't have a picture of this step.*

Take the rear rims and fit the tires onto them. Instructions to attaching wheels are in the kit's instruction packet; follow those to secure the wheels.

## Attach Servo, ESC, and Motor

Use the two included screws in the kit to mount the [Fantom ICON sensored brushless motor](https://fantomracing.com/shop/motors/spec-motors/25-5-icon-torque-works-edition/) to the motor bracket. Then, align the [12-tooth pinion gear](https://www.amazon.com/Traxxas-PINION-PITCH-SCREW-2428/dp/B00EFXMUO2) on the motor shaft and turn the set screw to lock it in place. The servo is placed in the servo bracket (specifics are included in the kit instructions). DO NOT tighten the servo horn to the gear yet, as it must first be centered in order for steering to work. The [HobbyWing Q10BL60 ESC](https://www.hobbywingdirect.com/products/quicrun-10-sensored) can be attached to the forward section using the VHB tape included with it. Make sure to solder the wires in the correct order, or the motor may not rotate. The capacitors for the ESC can be double-sided taped to the forward section as well.

![top-down view](./Documentation/img/build-1.jpg)

*Our build uses a different 25.5T brushless motor from HobbyWing but we had to modify our chassis to make it fit. The code will still work with the motor in these instructions.*

## Solder Electrical Components

#### Connectors and Voltage Regulator Adjusting

On the ends of the power leads of the ESC, solder a female XT60 connector and four 20-gauge wires - two on power and two on ground. Make sure it's polarized the same way as the batteries or you risk breaking things. Solder the 20-gauge wires to the inputs of the two [voltage regulators](https://www.amazon.com/Regulator-Adjustable-Converter-Electronic-Stabilizer/dp/B07PDGG84B/ref=sr_1_18). **Ensure that the polarity is correct while soldering.** Power the regulators by plugging a battery in to the XT60 connector, and change the output voltage of the regulators to 7.4V and 5V. For more information see [this guide by Robottronic](https://www.instructables.com/How-to-Use-DC-to-DC-Buck-Converter-LM2596/).

## Voltage Regulators

On the output of the 7.4V regulator, solder two single-pin headers. Now, attach the [digital voltometer](https://www.amazon.com/bayite-Digital-Voltmeter-Display-Motorcycle/dp/B00YALUXH0/). On the input, solder the ground wire (black) to the negative terminal, and the power and source wires (red and white) to the positive terminal. On the output of the 5V regulator, solder the [DC barrel jack](https://www.amazon.com/Pigtails-Female-Connector-Pigtail-Security/dp/B08PYWN3T7/) (again, making sure that the polarity is correct). The 7.4V regulator outputs should have two male Dupont connectors soldered to them, facing upwards. This is to make plugging the servos in easier.

![soldered regulators](./Documentation/img/build-2.jpg)

## Wiring

*This part of the instructions assumes that you have a dupont connector crimping set*

Crimp connectors for servo power and PWM. Use 10cm lengths of 20-24 gauge wire. The servo connector should have a 3-pin male connector with 3 1-pin female connectors. The ESC connector has one male connector in a 3-pin connector and one female connector.



![indicators, connectors, and a button](./Documentation/img/build-3.jpg)

crimp indicators, button, jumpers, optional wifi stuff

ensure that power, ground, and PWM wires are labeled

## Jetson NANO

### Board Setup, SSHFS, and Static IP

Visit [Yahboom](http://www.yahboom.net/)'s [setup and tutorial repository](http://www.yahboom.net/study/jetson-nano) to begin setting up the [Jetson NANO 4GB](https://category.yahboom.net/collections/jetson/products/jetson-nano-sub). Follow steps 1.1-1.7 in "Development setup > SUB Version".

After setting up the board, follow step 2.1 in section "Basic Settings" to log into your Jetson NANO. Keep PuTTY open, as it will be used for the rest of the setup process. Also keep the IP. For remote file transfer, install sshfs (linux only), or use [sshfs-win](https://github.com/winfsp/sshfs-win) from WinFsp. Follow instructions to mount the Jetson NANO to a network drive. Now upload all contents of the `/Program/` folder into a new folder on the Jetson NANO. Remember the directory of the folder, this will be used later.

Make sure a static IP is set to the board to make SSH and file transfer easier. Go to your router settings and [assign a DHCP reservation (PCmag)](https://www.pcmag.com/how-to/how-to-set-up-a-static-ip-address) (or a straight static IP) to your Jetson NANO. Save this IP in your PuTTY settings and SSHFS mounting.

### Enable GPIO and PWM

Next, setting up the board for the application. First, enable GPIO and PWM. Create a new user group, and add your user to it (this is the user running the commands).

```
sudo groupadd -f -r gpio
sudo usermod -a -G gpio your_user_name
```

Copy the `99-gpio.rules` file from the `/Program/` folder to `/etc/udev/rules.d/` on the Jetson NANO (use sshfs or ). Then enable the rule.

```
sudo udevadm control --reload-rules && sudo udevadm trigger
```

Now enable PWM. Run the options file for jetson-GPIO.

```
sudo /opt/nvidia/jetson-io/jetson-io.py
```

Go down to "Configure 40-pin expansion header" and enter that submenu. Find `pwm0` and `pwm`, and enable them by selecting them and pressing "Enter". Now exit the tool. GPIO and PWM have been enabled.

### Text-Only, Auto-Login, and Run on Startup

Switch the Jetson NANO to text-only mode (gui is almost useless for this application and only causes unneccesary slowness).

```
sudo systemctl set-default multi-user.target
```

Autologin must be done to avoid having to plug in a monitor and keyboard to start ssh and run programs. The following accomplishes it:

```
sudo systemctl edit getty@tty1
```

A temporary editer will appear. Place the following text in it, replacing "your_user_name" with your user name.

```
[Service]
ExecStart=
ExecStart=-/sbin/agetty -o '-p -f your_user_name' -a your_user_name --noclear %I $TERM
```

Save and close the editor with `:qa`.

To run the program on startup, first obtain the directory of the program folder uploaded earlier. Create `spark_startup.service` in `/etc/systemd/system` and place the following in the contents, replacing "/filepath/" with the directory of the folder.

```
[Service]
ExecStart=/bin/bash /filepath/startup.py
```

Save the file and add permissions to it.

```
sudo chmod 644 /etc/systemd/system/spark_startup.service
systemctl enable spark_startup.service
```

Reboot the Jetson NANO to test if these changes worked. No GUI should appear and you shuld be automatically logged in.

Enable run-on-startup by editing `run-on-startup.txt` in the folder. Replace the first line with `true`.

Reboot the Jetson NANO again

### Optional Fan

Add the [Noctua NF-A4X10 5V PWM fan](https://noctua.at/en/products/fan/nf-a4x10-5v) to the board using M3x20mm nylon screws. Metal screws may be required to "tap" the holes (it's best to use an actuall tapper, though).

## Platform Standoffs

Follow the diagram below to place the spacers and standoffs for the mounting of the upper platform and camera. The rear two are spacers, and the other six will replace existing screws.

![standoff/spacer locations](./Documentation/img/build-4.jpg)

Use the diagram below to fill in the standoffs on the top platform. All standoffs in green are M3x6mm nylon standoffs, and the blue are M2.5x5mm brass spacers (included with Jetson NANO). Use M3 nylon nuts to hold the nylon standoffs onto the board and use 8mm M2.5 screws to hold the brass spacers onto the board.

![standoff locations on platform](./Documentation/img/build-5.jpg)

*Note: Platform in diagram is of a slightly older design of V5. Standoff and spacer locations still apply.*

## Top Platform Assembly

Place the top platform assembly on top of the 25mm/20mm brass standoffs mentioned [earlier](#platform-standoffs). Screw them in using M3x6mm countersunk screws. Route the wires through the provided cable management holes. The way they are routed doesn't matter, but the use the image below for a general guide on routing wires. The [voltage regulators](#voltage-regulators) are attached to the [diagonal nylon spacers (image 2, red)](#platform-standoffs) with 6mm M3 nylon screws, with the outputs facing toward the side with the [button and indicator LEDS](#wiring), as well as the 5V regulator being in the front (narrow end) and the 7.4V regulator in the back (LED indicator end). The voltometer](https://www.amazon.com/bayite-Digital-Voltmeter-Display-Motorcycle/dp/B00YALUXH0/) goes on the [two nylon standoffs (image 2, red)](#platform-standoffs) on the input side of the 7.4V regulator.

![platform mounted with voltage regulators](./Documentation/img/build-6.jpg)

Place the [assembled Jetson NANO](#jetson-nano) on the [four brass standoffs (image 2, blue)](#platform-standoffs) and secure with the provided M2.5x5mm screws. If there is a [WiFi card](https://www.newegg.com/p/0XM-009Y-001C7), route the antenna cables to the rear (right of image) and attach to the holders.

![platform with everything mounted](./Documentation/img/build-7.jpg)

## Camera Setup
Follow instructions to assemble the [Arducam IMX219 175 Degree camera](https://www.amazon.com/Arducam-Raspberry-Official-Megapixel-Replacement/dp/B083PW4BLH/). Use M2.5x4mm screws to mount the camera onto the front of camera bracket. Make sure the CSI slot is on the top side.

Screw the camera bracket onto the [four brass standoffs (image 1, yellow)](#platform-standoffs) in the front of the car.

Later, focus the camera and make it slightly blurry - this filters some far-away noise in the image without impacting performance.

## Plugging it All In

check wiring

![pin numberings](./Documentation/img/build-8.jpg)