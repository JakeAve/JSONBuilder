// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { remote, ipcRenderer } = require('electron')
const { Menu, MenuItem, dialog } = remote
const fs = remote.require('fs')

const menu = new Menu()
menu.append(new MenuItem({ label: 'Undo Table Change', click() { undoTableChange() } }))
menu.append(new MenuItem({ label: 'Redo Table Change', click() { redoTableChange() } }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ role: 'copy' }))
menu.append(new MenuItem({ role: 'paste' }))
menu.append(new MenuItem({ label: 'Paste Table', click() {pasteTable()}}))

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

function convertToArray(table) {
    const headers = Array.from(table.querySelector('THEAD').querySelector('TR:last-child').querySelectorAll('TH'));
    const rows = Array.from(table.querySelector('TBODY').querySelectorAll('TR'));
    function JSONObject(keys, values) {
        keys.slice(0, keys.length - 1).forEach((key, index, arr) => {
            this[key.innerHTML] = values[index].innerHTML;
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
            const rows = clipText.split('\n');
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
    function addBlank(number) {
        let repeatedString = '';
        while (number > 0) {
          repeatedString += '<td contenteditable></td>';
          number--;
        }
        return repeatedString;
    }
    const tableText = rows.map(row => `<tr draggable="true">\n\t<td contenteditable>${row.replace(/\t/g, '</td>\n\t<td contenteditable>')}</td>\n\t${addBlank(existingCols - pasteCols)}<td><button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteRow(this);">X</button></td>\n\t<td onmousedown="highlightRow(this);"><div class="row-number"></div><i class="fas fa-ellipsis-v"></i></td>\n</tr>`).join('\n');
    document.querySelector('TBODY').innerHTML += tableText;
}

function createTable(obj, objKeys, innerObjKeys) {
    document.querySelector('THEAD').querySelector('TR').innerHTML = `<th><button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteCol(this);">X</button></th>`;

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
    data.startsWith('const ') || data.startsWith('let ') || data.startsWith('var ') ? mainVariable = data.slice(0, equalSignPos) : mainVariable = '';
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
    console.log(fullPath);
}

function openFile() {
    dialog.showOpenDialog(
        { properties: ['openFile'] },
        (res => {
            if (res) {
                const fileName = res.toString();
                console.log('selected file', res)
                setFileName(fileName);
                const data = fs.readFileSync(fileName, 'utf8');
                compileDataForTable(data);
            }
        })
    )
}

function saveFile() {
    try {
        console.log('saving')
        fs.writeFileSync(documentFilePath, convertToJSON(), err => {
            if (err)
                showError(err)
            console.log('saving', convertToJSON());
        })
    } catch {
        console.log('save as')
        saveAs()
    }
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
            setFileName(fileName)
            saveFile();
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
    const fileName = documentFilePath !== undefined ? documentFilePath : '';
    try {
        const fileData = fs.readFileSync(fileName, 'utf8');
        const currentData = convertToJSON();
        if (currentData === fileData) 
            callback()
        else saveFirstDialog(callback);

    } catch {
        if (convertToJSON() === starter)
            newTable()
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

ipcRenderer.on('reload-data', (e, jsonData, fileName) => {
    console.log('ran reload data')
    fileName ? setFileName(fileName) : setFileName();
    compileDataForTable(jsonData)
})

if (!documentFilePath) {
    console.log('no doc path', documentFilePath)
    newTable();
}
