document.getElementById('subscribeButton').addEventListener('click', function(event) {
    event.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const preferredTime = document.getElementById('preferredTime').value.trim();
    const statusMessage = document.getElementById('statusMessage');

    // Validate inputs
    if (!phoneNumber || !preferredTime) {
        statusMessage.textContent = "Please enter both a phone number and a preferred time.";
        statusMessage.style.color = "red";
        return;
    }

    // Validate time format (HH:MM AM/PM)
    const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)$/i;
    if (!timeRegex.test(preferredTime)) {
        statusMessage.textContent = "Please enter time in HH:MM AM/PM format, e.g., 02:30 PM.";
        statusMessage.style.color = "red";
        return;
    }

    // Normalize the time format (ensure proper padding and case)
    const [time, period] = preferredTime.split(/\s+/);
    const [hours, minutes] = time.split(':');
    const normalizedTime = `${hours.padStart(2, '0')}:${minutes} ${period.toUpperCase()}`;

    const payload = {
        phoneNumber: phoneNumber,
        time: normalizedTime // Named 'time' for consistency with original script.js
    };

    // Send the data to the server to subscribe
    fetch('/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        statusMessage.textContent = data.message;
        statusMessage.style.color = data.message.includes("success") ? "green" : "red";
        if (data.message === 'Successfully subscribed!') {
            document.getElementById('phoneNumber').value = '';
            document.getElementById('preferredTime').value = '';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        statusMessage.textContent = 'Error subscribing. Please try again.';
        statusMessage.style.color = "red";
    });
});