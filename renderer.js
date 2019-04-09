// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
let mainVariable;
let key0;

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

document.querySelector('#save-updates').addEventListener('click', () => {
    document.querySelector('#file-path').innerHTML === '' ? saveAs() : saveFile();
});

function addNewRow(content = []) {
    const rows = document.querySelector('TABLE').querySelectorAll('TR');
    const numberOfCols = rows[0].querySelectorAll('TH').length;
    const newRow = document.createElement('TR');
    newRow.draggable = 'true';
    for (let i = 0; i < numberOfCols; i ++)
        newRow.innerHTML += `<td contenteditable>${content.length === 0 ? `Col${i + 1} Row${rows.length - 1}` : content[i]}</td>`;
        newRow.innerHTML += `<td><button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteRow(this);">X</button></td>`
    newRow.innerHTML += `<td onmousedown="highlightRow(this);"><div class="row-number">${rows.length - 1}</div><i class="fas fa-ellipsis-v"></i></td>`;
    document.querySelector('TBODY').appendChild(newRow);
};

document.querySelector('#add-new-row').addEventListener('click', () => {
    addNewRow();
});

function addNewCol(content = '') {
    const rows = Array.from(document.querySelector('TABLE').querySelectorAll('TR'));
    const numberOfCols = rows[0].querySelectorAll('TH').length;
    rows.forEach((row, index) => {
        const newCell = index === 1 || index === 0 ? document.createElement('TH') : document.createElement('TD');
        if (index === 0) {
            newCell.innerHTML = `<button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteCol(this);">X</button>`;
        }
        else {
            newCell.contentEditable = true;
            newCell.innerHTML = content === '' ? `Col${numberOfCols} Row${index - 1}` : content;
        }
        row.children[numberOfCols - 1].insertAdjacentElement('afterend', newCell);
    })
};

document.querySelector('#add-new-col').addEventListener('click', () => {
    addNewCol();
});
/*
var changesToTable = [];
var currentPosInChangesToTable = -1;
function saveTable() {
    changesToTable.push(convertToArray());
    currentPosInChangesToTable !== changesToTable.length - 1 ? currentPosInChangesToTable = changesToTable.length - 1 : currentPosInChangesToTable ++;
    console.log('save table', currentPosInChangesToTable, changesToTable.length);
    //console.log(changesToTable);

    //console.log(changesToTable, currentPosInChangesToTable);
};
saveTable();

function undoTableChange() {
    
    //currentPosInChangesToTable --;
    console.log('undo table', currentPosInChangesToTable, changesToTable.length);
    currentPosInChangesToTable > 0 ? compileDataForTable(changesToTable[-- currentPosInChangesToTable]) : null;
}

function redoTableChange() {
    
    //currentPosInChangesToTable ++;
    console.log('redo table', currentPosInChangesToTable, changesToTable.length);
    currentPosInChangesToTable < changesToTable.length - 1 ? compileDataForTable(changesToTable[++ currentPosInChangesToTable]) : null;
}
*/
const { remote, ipcRenderer } = require('electron')
const { Menu, MenuItem, dialog } = remote
const fs = remote.require('fs')

const menu = new Menu()
menu.append(new MenuItem({ label: 'Undo Table Change', click() { undoTableChange() } }))
menu.append(new MenuItem({ label: 'Redo Table Change', click() { redoTableChange() } }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: 'Copy Text', click() {console.log('pasting normal text')}}))
menu.append(new MenuItem({ label: 'Paste Text', click() {console.log('pasting normal text')}}))
menu.append(new MenuItem({ label: 'Paste Table', click() {pasteTable()}}))

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  //e.target.className = 'move-row' ? 
  menu.popup({ window: remote.getCurrentWindow() })
}, false)

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
    const equalSignPos = data.startsWith('const ') || data.startsWith('let ') || data.startsWith('var ') ? data.indexOf('=') + 1 : 0;
    data.startsWith('const ') || data.startsWith('let ') || data.startsWith('var ') ? mainVariable = data.slice(0, equalSignPos) : mainVariable = '';
    const JSONobj = data.slice(equalSignPos);
    const parsedObj = JSON.parse(JSONobj);
    const obj = Object.keys(parsedObj).length === 1 ? parsedObj[Object.keys(parsedObj)[0]] : parsedObj;
    Object.keys(parsedObj).length === 1 ? key0 = Object.keys(parsedObj)[0] : key0 = '';
    const objKeys = Object.keys(obj);
    //console.log(objKeys);
    const innerObjKeys = Object.keys(obj[objKeys[0]]);
    //console.log(innerObjKeys);
    createTable(obj, objKeys, innerObjKeys);
}

function openFile() {
    dialog.showOpenDialog(
        { properties: ['openFile'] },
        (res => {
            //console.log(res);
            const fileName = res.toString();
            document.querySelector('#file-path').innerHTML = fileName;
            document.querySelector('#file-name').innerHTML = fileName.slice(fileName.lastIndexOf('\\') + 1, fileName.lastIndexOf('.'));
            const data = fs.readFileSync(fileName, 'utf8');
            //console.log(data);
            compileDataForTable(data);
        })
    )
}

function saveFile() {
    fs.writeFileSync(document.querySelector('#file-path').innerHTML, convertToJSON(), err => {
        if (err)
            console.log(err)
    })
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
            document.querySelector('#file-path').innerHTML = fileName;
            document.querySelector('#file-name').innerHTML = fileName.slice(fileName.lastIndexOf('\\') + 1, fileName.lastIndexOf('.'));
            saveFile();
        })
    )
}

document.querySelector('#save-as').addEventListener('click', saveAs);

ipcRenderer.on('request-to-open', openFile)

ipcRenderer.on('request-to-save', saveFile)

ipcRenderer.on('request-to-saveas', saveAs)

ipcRenderer.on('request-json-preview', () => {
    ipcRenderer.send('json-data', convertToJSON())
})

function saveFirstDialog() {
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
    })
}