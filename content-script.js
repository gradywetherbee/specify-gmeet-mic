
async function withExponentialBackoff({ fn, maxRetries = 6, delay = 50 }) {
    try {
        const result = await fn();
        return result;
    } catch (error) {
        if (maxRetries === 0) {
            throw error;
        } else {
            const nextDelay = delay * 2;
            await new Promise(resolve => setTimeout(resolve, delay));
            return withExponentialBackoff({ fn, maxRetries: maxRetries - 1, delay: nextDelay });
        }
    }
}

async function delay(milliseconds = 500) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": true
});

(async () => {

    let data = await chrome.storage.local.get(["selectedMicName", "mics"])

    let { selectedMicName, mics } = data

    if (!mics) {
        await updateDeviceList()
    } else {
        await setMic(selectedMicName)
    }

    // When you put your earbuds or headphones on in the middle of a call, your chosen mic will be selected again for you after a few seconds.
    
    let eventHandled = false

    navigator.mediaDevices.ondevicechange = async (event) => {
        if (!eventHandled) {
            eventHandled = true
            setTimeout(async () => {
                await setMic(selectedMicName)
            }, 3000)

            setTimeout(() => {
                eventHandled = false
            }, 5000)

            await updateDeviceList()
        }
    };

})();

async function updateDeviceList() {
    try {
        let devices = await navigator.mediaDevices.enumerateDevices()

        // Airpods show up multiple times so we want to hide one of them

        let mics = devices
            .filter(d => d.kind === "audioinput" && d.label !== "AirPods")
            .map(d => ({ label: d.label }))

        chrome.storage.local.set({ mics });
    } catch (err) {
        console.error(err)
    }
}

async function setMic(micName) {

    if (!micName) {
        return
    }

    await withExponentialBackoff({
        fn: clickMoreOptionsButton
    })

    await withExponentialBackoff({
        fn: clickSettingsButton
    })

    await withExponentialBackoff({
        fn: async function () {
            await delay(700)
            await clickMicrophoneSelector()
        }
    })

    await withExponentialBackoff({
        fn: async function () {
            await delay(200)
            await clickDesiredMic(micName)
        }
    })

    await withExponentialBackoff({
        fn: async function () {
            await checkIfDesiredMicSelected(micName)
        }
    })

    await withExponentialBackoff({
        fn: closeDialog
    })
}

// Functions for interacting with the DOM

async function clickMoreOptionsButton() {
    let moreActionsButtons = Array.from(document.querySelectorAll("button[aria-label='More options']"))

    let isInCall = Boolean(document.querySelector("button[aria-label='Leave call']"))

    let moreActionsButton

    // Chat and participants buttons are hidden under another more options button on small screens
    
    if (window.innerWidth < 600 && isInCall) {
        moreActionsButton = moreActionsButtons.at(-2)
    } else {
        moreActionsButton = moreActionsButtons.at(-1)
    }

    if (!moreActionsButton) {
        throw new Error('"More actions" button not found')
    }

    moreActionsButton.dispatchEvent(clickEvent)
}

async function clickSettingsButton() {
    let optionsMenu = document.querySelectorAll("ul[aria-label='Call options'] > li")

    let settingsButton = Array.from(optionsMenu).find(el => el.innerText.includes('Settings'))

    if (!settingsButton) {
        throw new Error('"Settings" button not found')
    }

    settingsButton.dispatchEvent(clickEvent)
}

async function clickMicrophoneSelector() {
    let micSelector = document.querySelector("div[data-aria-label='Select Microphone'] > div > div > div")

    if (!micSelector) {
        throw new Error('Mic selector not found')
    }

    micSelector.dispatchEvent(clickEvent)
}

async function clickDesiredMic(micName) {
    let selector = `li[aria-label*='${micName}']`

    let micOption = document.querySelector(selector)

    if (!micOption) {
        throw new Error('Mic selector not found')
    }

    micOption.dispatchEvent(clickEvent)
}

async function closeDialog() {
    let closeButton = document.querySelector("button[aria-label='Close dialog']")

    if (!closeButton) {
        throw new Error('Mic selector not found')
    }

    closeButton.dispatchEvent(clickEvent)
}

async function checkIfDesiredMicSelected(micName) {
    let builtInSelected = document.querySelector("div[data-aria-label='Select Microphone'] > div > div > div > span:nth-of-type(2) > span")

    if (!builtInSelected?.innerText?.includes(micName)) {
        throw new Error('Desired mic not selected')
    }
}