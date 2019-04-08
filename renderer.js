// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
function convertToJSON(table) {
    const headers = Array.from(table.querySelector('THEAD').querySelector('TR:last-child').querySelectorAll('TH'));
    const rows = Array.from(table.querySelector('TBODY').querySelectorAll('TR'));
    function JSONObject(keys, values) {
        keys.slice(0, keys.length - 1).forEach((key, index, arr) => {
            this[key.innerHTML] = values[index].innerHTML;
        })
    }
    const arrayOfData = rows.map(row => new JSONObject(headers, Array.from(row.querySelectorAll('TH, TD'))));
    console.log(JSON.stringify(arrayOfData, null, 4));
    return JSON.stringify(arrayOfData, null, 4)
};

document.querySelector('#save-updates').addEventListener('click', () => {
    //const jsonData = convertToJSON(document.querySelector('TABLE'));
    document.querySelector('#file-path').value === '' ? saveAs() : saveFile();
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
    saveTable();
};

document.querySelector('#add-new-row').addEventListener('click', () => {addNewRow()});

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
            console.log(content);
        }
        row.children[numberOfCols - 1].insertAdjacentElement('afterend', newCell);
    })
    saveTable();
};

document.querySelector('#add-new-col').addEventListener('click', () => {addNewCol()});

const changesToTable = [];
var currentPosInChangesToTable = 0;
function saveTable() {
    changesToTable.push(convertToJSON(document.querySelector('TABLE')));
    currentPosInChangesToTable ++;
    //console.log(changesToTable, currentPosInChangesToTable);
};

function undoTableChange() {
    document.querySelector('TABLE').innerHTML = changesToTable[currentPosInChangesToTable --];
}

function redoTableChange() {
    document.querySelector('TABLE').innerHTML = changesToTable[currentPosInChangesToTable --];
}

const { remote } = require('electron')
const { Menu, MenuItem, dialog } = remote
const fs = remote.require('fs')

const menu = new Menu()
menu.append(new MenuItem({ label: 'Undo Table Change', click() { console.log('item 1 clicked') } }))
menu.append(new MenuItem({ label: 'Redo Table Change', click() { console.log('item 1 clicked') } }))
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
                type: 'warning', 
                alwaysOnTop: true, 
                message: 'The table you are pasting does not have the same number of columns as the existing one. Would you like to adjust the size of this table?',
                buttons: ['Yes', 'No']
        }, (res => {
            if (res === 0)
                (insertTable(rows, pasteCols, existingCols))
        }))
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
    const tableText = rows.map(row => `<tr draggable="true">\n\t<td contenteditable>${row.replace(/\t/g, '</td>\n\t<td contenteditable>')}</td>\n\t${addBlank(existingCols - pasteCols)}<td><div class="row-number"></div><button onmousedown="highlightRow(this);" type="button" class="btn btn-secondary btn-sm">Move</button></td>\n\t<td><button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteRow(this);">X</button></td>\n</tr>`).join('\n');
    document.querySelector('TBODY').innerHTML += tableText;
    saveTable();
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

function pullDataFromTable(data) {
    const equalSignPos = data.startsWith('const ') || data.startsWith('let ') || data.startsWith('var ') ? data.indexOf('=') + 1 : 0;
    console.log(equalSignPos);
    const endOfConst = data.indexOf('const ') < equalSignPos ? data.indexOf('const ') + 6 : 0;
    equalSignPos ? document.querySelector('#file-name').value = data.slice(endOfConst, equalSignPos - 2).trim() : '';
    const JSONobj = data.slice(equalSignPos);
    const parsedObj = JSON.parse(JSONobj);
    const objKeys = Object.keys(parsedObj);
    const innerObjKeys = Object.keys(parsedObj[objKeys[0]]);
    //console.log(innerObjKeys);
    createTable(parsedObj, objKeys, innerObjKeys);
}

document.querySelector('#choose-file').addEventListener('click', openFile);

function openFile() {
    dialog.showOpenDialog(
        { properties: ['openFile'] },
        (res => {
            console.log(res);
            const fileName = res.toString();
            document.querySelector('#file-path').value = fileName;
            document.querySelector('#file-name').value = fileName.slice(fileName.lastIndexOf('\\') + 1, fileName.lastIndexOf('.'));
            const data = fs.readFileSync(fileName, 'utf8');
            console.log(data);
            
            pullDataFromTable(data);
        })
    )
}

function saveFile() {
    fs.writeFileSync(document.querySelector('#file-path').value, convertToJSON(document.querySelector('TABLE')), err => {
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
        }, (res => {
            document.querySelector('#file-path').value = res;
            saveFile();
        })
    )
}

document.querySelector('#save-as').addEventListener('click', saveAs);