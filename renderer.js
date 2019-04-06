// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
function convertToJSON(table) {
    const headers = Array.from(table.querySelector('THEAD').querySelector('TR:last-child').querySelectorAll('TH'));
    const rows = Array.from(table.querySelector('TBODY').querySelectorAll('TR'));
    function JSONObject(keys, values) {
        keys.slice(0, keys.length - 2).forEach((key, index, arr) => {
            this[key.innerHTML] = values[index].innerHTML;
        })
    }
    const arrayOfData = rows.map(row => new JSONObject(headers, Array.from(row.querySelectorAll('TH, TD'))));
    console.log(JSON.stringify(arrayOfData, null, 4));
    return JSON.stringify(arrayOfData, null, 4)
};

document.querySelector('#save-updates').addEventListener('click', () => {
    convertToJSON(document.querySelector('TABLE'));
});

function addNewRow() {
    const rows = document.querySelector('TABLE').querySelectorAll('TR');
    const numberOfCols = rows[0].querySelectorAll('TH').length;
    const newRow = document.createElement('TR');
    for (let i = 0; i < numberOfCols; i ++)
        newRow.innerHTML += `<td contenteditable>Col${i + 1} Row${rows.length - 1}</td>`;
    newRow.innerHTML += `<td><div class="row-number">${rows.length - 1}</div><button onmousedown="highlightRow(this);" type="button" class="btn btn-secondary btn-sm">Move</button></td>`;
    newRow.innerHTML += `<td><button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteRow(this);">X</button></td>`
    document.querySelector('TBODY').appendChild(newRow);
    saveTable();
};

document.querySelector('#add-new-row').addEventListener('click', addNewRow);

function addNewCol() {
    const rows = Array.from(document.querySelector('TABLE').querySelectorAll('TR'));
    const numberOfCols = rows[0].querySelectorAll('TH').length;
    rows.forEach((row, index) => {
        const newCell = index === 1 || index === 0 ? document.createElement('TH') : document.createElement('TD');
        if (index === 0) {
            newCell.innerHTML = `<button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteCol(this);">X</button>`;
        }
        else {
            newCell.contentEditable = true;
            newCell.innerHTML = `Col${numberOfCols} Row${index - 1}`;
        }
        row.children[numberOfCols - 1].insertAdjacentElement('afterend', newCell);
    })
    saveTable();
};

document.querySelector('#add-new-col').addEventListener('click', addNewCol);


const changesToTable = [];
var currentPosInChangesToTable = 0;
function saveTable() {
    changesToTable.push(document.querySelector('TABLE').innerHTML);
    currentPosInChangesToTable ++;
    console.log(changesToTable, currentPosInChangesToTable);
};

function undoTableChange() {
    document.querySelector('TABLE').innerHTML = changesToTable[currentPosInChangesToTable --];
}

function redoTableChange() {
    document.querySelector('TABLE').innerHTML = changesToTable[currentPosInChangesToTable --];
}