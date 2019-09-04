const runSync = require('child_process').execSync;
const runp = require('child-process-promise').exec;
const fs = require('fs');

const networkTemplate = `network={
    ssid="$ssid"
    psk="$password"
}`

module.exports = function () {
    isConnected = function () {
        try {
            let res = runSync("iwgetid").toString();
            const ssidMarker = "ESSID:";
            let ssid = res.substring(res.indexOf(ssidMarker) + ssidMarker.length).trim();
            return ssid.length > 2;
        } catch (e) {
            return false;
        };
    }

    findNetworks = async function () {
        res = await runp('iwlist wlan0 scan');
        const lines = res.stdout.split('\n');
        const SSIDLines = lines.filter(x => x.trim().startsWith('ESSID'));
        let ssids = SSIDLines.map(line => {
            return line.substr(line.indexOf(':') + 1).slice(1, -1);
        }).filter(x => x.length >= 1);
        let uniqSsids = [...new Set(ssids)];
        return uniqSsids;
    }

    setupWifi = function () {
        return new Promise(function (resolve, reject) {
            if (isConnected()) {
                console.log('connected!')
                resolve();
            } else {
                //console.log('starting access point...')
                console.log('waiting for connection...')
                setTimeout(setupWifi, 10000);
            }
        });
    }

    connectNetwork = async function (ssid, password) {
        try {
            runp('systemctl stop hostapd');
            runp('systemctl stop dnsmasq');
            let network = networkTemplate.replace('$ssid', ssid).replace('$password', password);
            fs.appendFileSync('/etc/wpa_supplicant/wpa_supplicant.conf', network);
            await runp('ifdown wlan0');
            await runp('ifup wlan0');
        } catch (err) {
            console.log(err);
        }
    }

    startAP = async function () {
        runp('ifconfig wlan0 192.168.1.1');
        runp('systemctl start hostapd');
        runp('systemctl start dnsmasq');
    }

    return {
        setupWifi,
        findNetworks,
        connectNetwork,
        isConnected,
        startAP
    }
}