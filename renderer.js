// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { remote, ipcRenderer, shell } = require('electron')
const { Menu, MenuItem, dialog } = remote
const fs = remote.require('fs')



const menu = new Menu()
menu.append(new MenuItem({ label: 'Undo Table Change', click() { undoTableChange() } }))
menu.append(new MenuItem({ label: 'Redo Table Change', click() { redoTableChange() } }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ role: 'copy' }))
menu.append(new MenuItem({ role: 'paste' }))
menu.append(new MenuItem({ 
    label: 'Paste Table',
    accelerator: 'commandOrControl + T',
    click() {pasteTable()}
}))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ 
    label: 'Add Row',
    click() {
        addNewRow()
    }
}))
menu.append(new MenuItem({ 
    label: 'Add Column',
    click() {
        addNewCol()
    }
}))
menu.append(new MenuItem({
    label: 'Open in default editor',
    click() {
        shell.openItem(documentFilePath)
    }
}))

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  menu.popup({ window: remote.getCurrentWindow() })
}, false)

/*const currentDocument = {
    mainVariable: undefined,
    key0: undefined,
    documentFilePath: undefined,
    setFileName: (fullPath = 'No File Selected', name = 'New JSON') => {
        document.querySelector('#file-path').innerHTML = fullPath;
        document.querySelector('#file-name').innerHTML = fullPath.includes('\\') ? fullPath.slice(fullPath.lastIndexOf('\\') + 1, fullPath.lastIndexOf('.')) : name;
        this.documentFilePath = fullPath.includes('\\') ? fullPath : undefined;
    },
    start: `[
        {
            "First Header": "First Item"
        }
    ]`
}*/

let mainVariable;
let key0;
let documentFilePath;

function setMainVariable(value) {
    if (value) {
        mainVariable = value;
        ipcRenderer.send('convert-to-js-object')
    } else {
        mainVariable = undefined;
        ipcRenderer.send('convert-to-json')
    }
}

function convertToArray(table) {
    const headers = Array.from(table.querySelector('THEAD').querySelector('TR:last-child').querySelectorAll('TH'));
    const rows = Array.from(table.querySelector('TBODY').querySelectorAll('TR'));
    function JSONObject(keys, values) {
        keys.slice(0, keys.length - 1).forEach((key, index, arr) => {
            this[key.innerHTML] = values[index].textContent;
        })
    }
    return rows.map(row => new JSONObject(headers, Array.from(row.querySelectorAll('TH, TD'))));
    // console.log(JSON.stringify(arrayOfData, null, 4));
    
};

function convertToJSON() {
    const array = convertToArray(document.querySelector('TABLE'));
    const fullObject = key0 ? {[key0] : array} : array;
    const jsonData = JSON.stringify(fullObject, null, 4);
    if (mainVariable)
        return mainVariable + ' ' + jsonData;
    else return jsonData
}

function pasteTable() {
    navigator.clipboard.readText()
        .then(clipText => {
            //this is for when excel files contain linebreaks within a cell
            const newString = clipText.replace(/([\t\n])("[\s\S]+?")/g, (matchedString, firstGroup, secondGroup) => {
                return firstGroup + secondGroup.replace(/"/g, '').replace(/\n/g, '\r')
            })
            const rows = newString.split('\n');
            rows.pop();
            const pasteCols = rows[0].split('\t').length;
            const existingCols = document.querySelector('TABLE').querySelector('TR').querySelectorAll('TH').length;
            if (pasteCols === existingCols) {
                insertTable(rows, pasteCols, existingCols);
            } else dialog.showMessageBox({
                type: 'question', 
                alwaysOnTop: true, 
                message: 'The table you are pasting does not have the same number of columns as the existing one. Would you like to adjust the size of this table?',
                buttons: ['Yes', 'No']
        }, res => {
            if (res === 0)
                insertTable(rows, pasteCols, existingCols)
        })
    })
}

function insertTable(rows, pasteCols, existingCols) {
    if (pasteCols > existingCols)
        for (let i = 0; i < pasteCols - existingCols; i ++)
            addNewCol();
    //makes sure all the pasted rows are the same length as pasteCols
    rows.forEach(row => {
        const cells = row.split('\t').map(cell => {
            return cell.trim()
        });
        if (cells.length === pasteCols) {
            //console.log('Equal')
            addNewRow(cells);
        } else if (cells.length > pasteCols) {
            let modifiedCells = [];
            while (cells.length > pasteCols) {
                modifiedCells.push(cells.splice(0, pasteCols));
            }
            modifiedCells.forEach(arr => addNewRow(arr))
            //console.log('cells is greater than paste cols', modifiedCells)
        } else if (cells.length < pasteCols) {
            while (cells.length < pasteCols) {
                cells.push('')
            }
            addNewRow(cells)
            //console.log('cells is less than paste cols', cells)
        }
    })
}

function createTable(obj, objKeys, innerObjKeys) {
    document.querySelector('THEAD').querySelector('TR').innerHTML = `<th><button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteCol(this);" title="Delete table">X</button></th>`;

    document.querySelector('THEAD').querySelector('TR:last-of-type').innerHTML = `<th id="first-header" scope="col" contenteditable>${innerObjKeys[0]}</th>\n<th colspan="2" rowspan="2"></th>`;

    const rows = document.querySelector('TBODY').querySelectorAll('TR');

    for (let row of rows)
        row.remove()

    innerObjKeys.slice(1).forEach(item => {
        addNewCol(item)
    })

    objKeys.forEach(row => {
        arr = innerObjKeys.map(key => obj[row][key]);
        addNewRow(arr);
    })

};

function compileDataForTable(data) {
    //console.log(data)
    const equalSignPos = data.startsWith('const ') || data.startsWith('let ') || data.startsWith('var ') ? data.indexOf('=') + 1 : 0;
    data.startsWith('const ') || data.startsWith('let ') || data.startsWith('var ') ? setMainVariable(data.slice(0, equalSignPos)) : setMainVariable(undefined);
    const JSONobj = data.slice(equalSignPos);
    //const JSONobj = data;
    try {
        const parsedObj = JSON.parse(JSONobj);
        if (Array.isArray(parsedObj)) {
            const arrayIndexes = Object.keys(parsedObj);
            const innerObjKeys = Object.keys(parsedObj[0]);
            key0 = '';
            createTable(parsedObj, arrayIndexes, innerObjKeys);
        } else {
            const obj = Object.keys(parsedObj).length === 1 ? parsedObj[Object.keys(parsedObj)[0]] : parsedObj;
            //console.log(Object.keys(parsedObj), Object.keys(parsedObj).length === 1, obj);
            Object.keys(parsedObj).length === 1 ? key0 = Object.keys(parsedObj)[0] : key0 = '';
            const objKeys = Object.keys(obj);
            //console.log(objKeys);
            const innerObjKeys = Object.keys(obj[objKeys[0]]);
            //console.log(innerObjKeys);
            createTable(obj, objKeys, innerObjKeys);
        }
    } catch(e) {
        showError(e);
        newTable();
    }
}

function setFileName(fullPath = 'No File Selected', name = 'New JSON') {
    document.querySelector('#file-path').innerHTML = fullPath;
    documentFilePath = fullPath.includes('\\') ? fullPath : undefined;
    document.querySelector('#file-name').innerHTML = fullPath.includes('\\') ? fullPath.slice(fullPath.lastIndexOf('\\') + 1, fullPath.lastIndexOf('.')) : name;
}

function openFile() {
    dialog.showOpenDialog(
        { properties: ['openFile'] },
        (res => {
            if (res) {
                const fileName = res.toString();
                //console.log('selected file', res)
                setFileName(fileName);
                const data = fs.readFileSync(fileName, 'utf8');
                compileDataForTable(data);
            }
        })
    )
}

function saveFile() {
    if (documentFilePath)
        fs.writeFileSync(documentFilePath, convertToJSON(), err => {
            if (err)
                showError(err)
            })
    else saveAs();
}

function saveAs() {
    dialog.showSaveDialog(
        { title: 'Save As', 
            filters: [
                { name: 'Javascript', extensions: ['js'] },
                { name: 'JSON', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        }, (fileName => {
            if (fileName) {
                setFileName(fileName)
                saveFile()
            }
        })
    )
}

function saveFirstDialog(callback) {
    dialog.showMessageBox({
        type: 'warning', 
        alwaysOnTop: true, 
        message: 'Would you like to save this before proceeding?',
        buttons: ['Save', 'Save As', `Don't Save`]
    }, res => {
        if (res === 0)
            saveFile()
        if (res === 1)
            saveAs()
        if (res === 2)
            callback()
    })
}

function showError(error) {
    dialog.showMessageBox({
        type: 'error',
        title: 'Error',
        alwaysOnTop: true, 
        message: `${error}`
    })
}

const starter = `[
    {
        "First Header": "First Item"
    }
]`

function newTable() {
    setFileName();
    compileDataForTable(starter);
}

function checkEverythingIsSaved(callback) {
    const fileName = documentFilePath;
    try {
        const fileData = fs.readFileSync(fileName, 'utf8');
        const currentData = convertToJSON();
        if (currentData === fileData) 
            callback()
        else saveFirstDialog(callback);

    } catch {
        if (convertToJSON() === starter)
            callback()
        else saveFirstDialog(callback);
    }
}

window.onbeforeunload = (e) => {
    console.log('ran before unload')
    ipcRenderer.send('reload-data', convertToJSON(), documentFilePath);
}

ipcRenderer.on('request-to-open', () => {checkEverythingIsSaved(openFile)})

ipcRenderer.on('request-to-save', saveFile)

ipcRenderer.on('request-to-saveas', saveAs)

ipcRenderer.on('request-json-preview', () => {
    ipcRenderer.send('json-data', convertToJSON())
})

ipcRenderer.on('new-table', () => {checkEverythingIsSaved(newTable)})

ipcRenderer.on('paste-table', pasteTable)

ipcRenderer.on('new-row', () => {addNewRow()})

ipcRenderer.on('new-col', () => {addNewCol()})

ipcRenderer.on('reload-data', (e, jsonData, fileName) => {
    fileName ? setFileName(fileName) : setFileName();
    jsonData ? compileDataForTable(jsonData) : newTable();
})

//ipcRenderer.on('convert-to-js-object')

ipcRenderer.on('convert-to-json', (e) => {
    //console.log('hi')
    if (mainVariable) 
        dialog.showMessageBox({
            type: 'warning',
            message: `This document currently begins with a variable "${mainVariable}". By converting to JSON, the variable will be deleted. Are you sure you want to convert to JSON?`,
            buttons: ['Yes', 'No']
        }, res => {
            if (res === 0)
                setMainVariable(undefined)
            else ipcRenderer.send('convert-to-js-object')
        })
})

ipcRenderer.on('convert-to-js-object', (e) => {
    if (!mainVariable) 
        dialog.showMessageBox({
            type: 'warning',
            message: `To convert to a Javascript object, you must define a variable and the data will no longer be compatible with functions like JSON.parse(). Are you sure you want to convert to a Javascript object?`,
            buttons: ['Yes', 'No']
        }, res => {
            if (res === 0)
                ipcRenderer.send('open-settings')
            else ipcRenderer.send('convert-to-json')
        })
})

ipcRenderer.on('request-settings-data', () => {
    const settings = {
        mainVariable,
        key0
    }
    ipcRenderer.send('settings-data', settings)
})

ipcRenderer.on('update-settings-data', (e, settings) => {
    setMainVariable(settings.mainVariable)
    key0 = settings.key0
})

ipcRenderer.on('open-in-editor', () => {
    if (documentFilePath)
    shell.showItemInFolder(documentFilePath)
    else dialog.showErrorBox('Error', 'You have not saved the document yet')
})
