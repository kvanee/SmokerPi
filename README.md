# SmokerPi

A Nodejs web application intended to be run on a raspberry pi (I'm using the zero W) used to control the temperature of a BBQ smoker by toggling a blower. 

![hardware_image_1](https://preview.ibb.co/fOBqrx/20180429_170052.jpg)
![hardware_image_1](https://preview.ibb.co/kekfPH/20180429_170134.jpg)


## Getting Started

TODO: These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Raspberry Pi with Raspbian 

Nodejs - Use [this](https://github.com/sdesalas/node-pi-zero) to update nodejs on the Pi Zero W.

A thermometer or two: https://www.adafruit.com/product/3290 
Thermometer Amplifier: https://www.adafruit.com/product/3328
5v relay to control the fan/blower: https://smile.amazon.com/gp/product/B00VRUAHLE/ref=oh_aui_search_detailpage?ie=UTF8&psc=1

### Installing

To test things out locally pass 'true' into the debug parameter of bbqMonitor: https://github.com/kvanee/SmokerPi/blob/master/app.js#L28 

## Deployment

On the raspberry pi run

```
sudo node app.js
```

## Built With

* [RaspberryPi](https://www.raspberrypi.org/) - Hardware
* [NodeJS](https://nodejs.org/en/) - JS Runtime
* [Express](https://expressjs.com/) - Web Framework
* [Express](https://expressjs.com/) - Web Framework

## Authors

* **Kelly Vanee** - *Initial work* 

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
TODO:

## PCB Design
https://easyeda.com/kelly.vanee/smokerpihat
