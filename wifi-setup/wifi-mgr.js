const runp = require('child-process-promise').exec;
const fs = require('fs');
const supplicantFile = '/etc/wpa_supplicant/wpa_supplicant.conf';
const networkPskPtrn = '(ssid="$ssid"[\\n\\r\\s]+psk=")(\\S*)(")';
const networkTemplate = `network={
    ssid="$ssid"
    psk="$password"
}`

const retry = (name, fn, ms = 2000, retries = 0, maxRetries = 10) => new Promise((resolve, reject) => {
    fn()
        .then(resolve)
        .catch((e) => {
            setTimeout(() => {
                console.log('retrying: ' + name + ' (' + retries + '/' + maxRetries + ')...');
                ++retries;
                if (retries > maxRetries) {
                    return reject('maximum retries exceeded');
                }
                retry(name, fn, ms, retries).then(resolve);
            }, ms);
        })
});


module.exports = function () {
    isConnected = async function () {
        ssid = await retry("getNetworkID", getNetworkID);
        if (ssid.length > 2) {
            console.log("Connected to " + ssid);
            return true;
        }
        return false;
    }
    getNetworkID = async function () {
        try {
            console.log("Checking connection..");
            let out = await runp("iwgetid");
            let outString = out.stdout;
            const ssidMarker = "ESSID:";
            let ssid = outString.substring(outString.indexOf(ssidMarker) + ssidMarker.length).trim();
            return ssid;
        } catch (e) {
            return '';
        };
    }

    findNetworks = async function () {
        out = await runp('iwlist wlan0 scan');
        const lines = out.stdout.split('\n');
        const SSIDLines = lines.filter(x => x.trim().startsWith('ESSID'));
        let ssids = SSIDLines.map(line => {
            return line.substr(line.indexOf(':') + 1).slice(1, -1);
        }).filter(x => x.length >= 1);
        let uniqSsids = [...new Set(ssids)];
        return uniqSsids;
    }

    connectNetwork = async function (ssid, password) {
        try {
            console.log("Attempting to connect to network...");
            await stopAP();
            await addNetwork(ssid, password);
            await toggleNetworkInterface();
            await retry("connect to network: " + ssid, tryConnect);
        } catch (err) {
            console.log(err);
        }
    }

    tryConnect = async function () {
        const connected = await isConnected();
        if (!connected) {
            throw "unable to connect";
        }
    };

    toggleNetworkInterface = async function () {
        console.log("Toggling network interface.");
        await runp('ifdown wlan0');
        await runp('ifup wlan0');
    }

    addNetwork = async function (ssid, password) {
        console.log("Adding Network");
        let network = networkTemplate.replace('$ssid', ssid).replace('$password', password);
        var fileData = fs.readFileSync(supplicantFile, 'utf8');
        const existingssid = 'ssid="$ssid"'.replace('$ssid', ssid);
        //add network
        if (!fileData.includes(existingssid))
            fs.appendFileSync(supplicantFile, network);
        else {
            //update password
            let regex = new RegExp(networkPskPtrn.replace('$ssid', ssid), 'g');
            var fileData = fileData.replace(regex, '$1' + password + '$3');
            fs.writeFileSync(supplicantFile, fileData);
        }
    }

    stopAP = async function () {
        console.log("Stopping Acces Point");
        runp('systemctl stop hostapd');
        runp('systemctl stop dnsmasq');
    }

    startAP = async function () {
        console.log("Starting Access Point");
        runp('ifconfig wlan0 192.168.1.1');
        runp('systemctl start hostapd');
        runp('systemctl start dnsmasq');
    }

    return {
        findNetworks,
        connectNetwork,
        isConnected,
        startAP,
        stopAP
    }
}