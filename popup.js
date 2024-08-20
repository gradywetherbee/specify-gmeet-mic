
// Here temporarily to clear for testing
// chrome.storage.local.clear()

chrome.storage.local.get(["selectedMicName", "mics"], function (data) {

    let { selectedMicName, mics } = data

    renderPopup({ selectedMicName, mics })
})

function create(tag) {
    let el = document.createElement(tag)
    return el
}

// Re-render the whole popup as a function of the state (similar in principal to a React functional component)

function renderPopup({ selectedMicName, mics }) {
    let root = document.getElementById('root')
    root.remove()

    root = create('div')
    root.id = 'root'
    document.body.append(root)

    let header = create('h1')
    header.innerText = "Specify Gmeet Microphone"
    root.append(header)

    if (!mics) {
        let noMicsWarning = create("p")
        noMicsWarning.innerText = "Go to a Google Meet lobby/call (or reload the one you have open) and then reopen this popup to see available mics here."
        root.append(noMicsWarning)
    } else {
        let intro = create('p')
        intro.innerText = "Auto-select this mic when I open Gmeet:"
        root.append(intro)

        if (!selectedMicName) {
            let warning = create("p")
            warning.innerText = "No default mic selected. Choose one!"
            root.append(warning)
        }
    }

    mics?.forEach(mic => {
        let button = create("button")
        button.innerText = mic.label
        button.style.width = '100%'
        if (selectedMicName === mic.label) {
            button.classList.add("selected")
        }
        button.addEventListener("click", () => {
            selectedMicName = mic.label
            chrome.storage.local.set({ selectedMicName: mic.label, selectedMicId: mic.id });
            renderPopup({ selectedMicName, mics })
        })
        root.append(button)
    })

}