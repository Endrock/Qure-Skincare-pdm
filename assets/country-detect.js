async function getClientIp() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return null;
    }
}

async function getCountryCode(ip) {
    try {
        const randomNum = Math.floor(Math.random() * 100000) + 1;
        const response = await fetch(`http://ipwhois.pro/${ip}?key=SUX3btwlpP5R3Gs8&random=${randomNum}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.country_code;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return 'UNKNOWN';
    }
}

async function is_country_us() {
    const clientIp = await getClientIp();
    if (clientIp === null) {
        console.error('Could not retrieve client IP address');
        return;
    }

    const countryCode = await getCountryCode(clientIp);

    if (['US'].includes(countryCode)) {
        return true;
    }

    return false;
}