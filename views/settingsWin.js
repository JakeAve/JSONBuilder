const { remote, ipcRenderer } = require('electron')
const { dialog } = remote
let currentSettings
ipcRenderer.on('settings-data', (e, settings) => {
    if (settings.mainVariable) {
        const variableParts = settings.mainVariable.split(' ')
        document.querySelector('#variable-type').value = variableParts[0];
        document.querySelector('#variable-name').value = variableParts[1];
    }
    if (settings.key0) 
        document.querySelector('#key0').value = settings.key0;
    currentSettings = settings;
})

document.querySelector('FORM').addEventListener('submit', (e) => {
    e.preventDefault();
    const rawForm = new FormData(document.querySelector('form'))
    const formData = {};
    for (var [key, value] of rawForm.entries()) { 
        console.log(key, value);
        formData[key] = value;
    }
    const newSettings = {};
    newSettings.key0 = formData['key0'] ? newSettings.key0 = formData['key0'] : newSettings.key0 = undefined;
    const newMainVariable = formData['variable-type'] === 'undefined' || !formData['variable-name'] ? undefined : `${formData['variable-type']} ${formData['variable-name']} =`
    if (currentSettings.mainVariable && !newMainVariable) {
        confirmJSON(`${formData['variable-type']} ${formData['variable-name']} =`)
            .then(mainVariable => {
                newSettings.mainVariable = mainVariable;
                saveSettings(newSettings)
            })
    } else if (!currentSettings.mainVariable && newMainVariable) {
        confirmJSObj(newMainVariable)
            .then(mainVariable => {
                newSettings.mainVariable = mainVariable;
                saveSettings(newSettings)
            })
    } else saveSettings(newSettings)

    console.log(newSettings)
    
})

function saveSettings(settings) {
    ipcRenderer.send('update-settings-data', settings)
}

function confirmJSON(value) {
    return new Promise((resolve) => {
        dialog.showMessageBox({
            type: 'warning',
            message: `This document currently begins with a variable "${settings.mainVariable}" and you have not created a new one. The variable will be deleted and the document will be converted to JSON. Are you sure you want to convert to JSON?`,
            buttons: ['Yes', 'No']
        }, res => {
            if (res === 0)
                resolve(undefined)
            else resolve(value)
        })
    })
}

function confirmJSObj(value) {
    return new Promise((resolve) => {
        dialog.showMessageBox({
            type: 'warning',
            message: `The data now be a Javascript object and will no longer be compatible with functions like JSON.parse(). Are you sure you want to convert to a Javascript object?`,
            buttons: ['Yes', 'No']
        }, res => {
            if (res === 0)
                resolve(value)
            else resolve(undefined)
        })
    })
}