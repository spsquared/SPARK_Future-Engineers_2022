<div align=center>

![banner](./img/banner.png)

</div>

***

# **Build Guide**

This is the build guide for our 2022 WRO Future Engineers design - Spark Plugs. It is segmented into four main steps, with more detailed steps within.

## Print Parts

Before starting assembly, be sure to 3D print all of the 3D-printed parts below:
* [Platform](https://github.com/definitely-nobody-is-here/SPARK_Future-Engineers_2022/raw/master/Documentation/CAD/SPARK2022_platform.stl)
* [Camera Mount](https://github.com/definitely-nobody-is-here/SPARK_Future-Engineers_2022/raw/master/Documentation/CAD/SPARK2022_cameramount.stl)
* [Camera LED Clip](https://github.com/definitely-nobody-is-here/SPARK_Future-Engineers_2022/raw/master/Documentation/CAD/SPARK2022_cameraLEDmount.stl)
* [Rear Wheel Rim](https://github.com/definitely-nobody-is-here/SPARK_Future-Engineers_2022/raw/master/Documentation/CAD/SPARK2022_rearwheelrim.stl) (if using the 1 in rubber tires)

You can start building while these are printing.

## Assemble Chassis Kit

Our design is built on top of a [Schumacher Atom 2 S2 GT12 Pan Car Kit](https://www.amainhobbies.com/schumacher-atom-2-s2-1-12-gt12-competition-pan-car-kit-schk179/p1055346). Follow the instructions in the box until the step to attach the bumper, which is omitted in our build. Make sure to replace the stock 64-tooth spur gear with a [78-tooth spur gear](https://www.amazon.com/Kimbrough-Pitch-Spur-Gear-78T/dp/B0006O1QVM). At this point, the car should look like the car on the box, except without wheels or a bumper.

![terrible paint 3d image](./Documentation/img/build-0.jpg)

*This image is an edited version of the carbon fibre edition. It's not ours, we didn't take a picture of just the chassis.*

Take the rear rims and fit the tires onto them. Instructions to attaching wheels are in the kit's instruction packet.

## Attach Motors and ESC

Use the two included screws in the kit to mount the [Fantom ICON V2 brushless motor](https://fantomracing.com/shop/motors/spec-motors/13-5-icon-v2-works-edition/) to the motor bracket. Then, align the [12-tooth pinion gear](https://www.amazon.com/Traxxas-PINION-PITCH-SCREW-2428/dp/B00EFXMUO2) on the motor shaft and turn the set screw to lock it in place. The servo is placed in the servo bracket (specifics are included in the kit instructions). DO NOT tighten the servo horn to the gear yet, as it must first be centered in order for steering to work. The [HobbyWing Q10BL60 ESC](https://www.hobbywingdirect.com/products/quicrun-10-sensored) can be attached to the forward section using the VHB tape included with it. Make sure to solder the wires in the correct order, or the motor may not rotate. The capacitors for the ESC can be double-sided taped to the forward section as well.

![top-down view](./Documentation/img/build-1.jpg)

## Solder Electrical Components

#### Connectors and Voltage Regulator Adjusting

On the ends of the power leads of the ESC, solder a female XT60 connector and four 20-gauge wires - two on power and two on ground. Make sure it's polarized the same way as the batteries or you risk breaking things. Solder the 20-gauge wires to the inputs of the two [voltage regulators](https://www.amazon.com/Regulator-Adjustable-Converter-Electronic-Stabilizer/dp/B07PDGG84B/ref=sr_1_18). **Ensure that the polarity is correct while soldering.** Power the regulators by plugging a battery in to the XT60 connector, and change the output voltage of the regulators to 7.4V and 5V. For more information see [this guide by Robottronic](https://www.instructables.com/How-to-Use-DC-to-DC-Buck-Converter-LM2596/).

## Voltage Regulators

On the output of the 7.4V regulator, solder two single-pin headers. Now, attach the [digital voltometer](https://www.amazon.com/bayite-Digital-Voltmeter-Display-Motorcycle/dp/B00YALUXH0/). On the input, solder the ground wire (black) to the negative terminal, and the power and source wires (red and white) to the positive terminal. On the output of the 5V regulator, solder the [DC barrel jack](https://www.amazon.com/Pigtails-Female-Connector-Pigtail-Security/dp/B08PYWN3T7/) (again, making sure that the polarity is correct).

![soldered regulators](./Documentation/img/build-2.jpg)

## Lights, Camera, and Wires

soldering, crimping

![lights, indicators, jumpers, and a button](./Documentation/img/build-3.jpg)

## Jetson NANO

attach fan, follow instructions to set up OS, create task to run startup.py on startup, switch to text-only mode

## Platform Mounting

Follow the diagram below to place the spacers and standoffs for the mounting of the upper platform and camera. The rear two are spacers, and the other six will replace existing screws.

![standoff/spacer locations](./Documentation/img/build-4.jpg)

Use the diagram below to fill in the standoffs on the top platform. All standoffs in green are M3x6mm nylon standoffs, and the blue are M2.5x5mm brass standoffs (included with Jetson NANO).

![standoff locations on platform](./Documentation/img/build-5.jpg)

## Top Platform Assembly

put everythign in, pin locations