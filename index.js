/*
document.querySelector('#save-updates').addEventListener('click', () => {
    document.querySelector('#file-path').innerHTML === '' ? saveAs() : saveFile();
});*/
const header = document.querySelector('.header');
const table = document.querySelector('TABLE');
document.addEventListener('scroll', () => {
  if (header.getBoundingClientRect().bottom > table.getBoundingClientRect().top)
    header.classList.add('small-header')
  else header.classList.remove('small-header')
}, {
  capture: true,
  passive: true
})

function addNewRow(content = []) {
    const rows = document.querySelector('TABLE').querySelectorAll('TR');
    const numberOfCols = rows[0].querySelectorAll('TH').length;
    const newRow = document.createElement('TR');
    for (let i = 0; i < numberOfCols; i ++)
      newRow.innerHTML += `<td contenteditable>${content.length === 0 ? `Col${i + 1} Row${rows.length - 1}` : content[i]}</td>`;
    newRow.innerHTML += `<td><button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteRow(this);" title="Delete row">X</button></td>`
    newRow.innerHTML += `<td onmousedown="dragRow(this);" title="Move row"><div class="row-number">${rows.length - 1}</div><i class="fas fa-ellipsis-v"></i></td>`;
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
            newCell.innerHTML = `<button type="button" class="btn btn-danger" tabindex="-1" onclick="deleteCol(this);" title="Delete column">X</button>`;
        }
        else {
            newCell.contentEditable = true;
            newCell.innerHTML = content === '' ? `Col${numberOfCols + 1} Row${index - 1}` : content;
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
function deleteRow(deleteBtn) {
    deleteBtn.parentElement.parentElement.remove();
  };

function deleteCol(deleteBtn) {
  const thisTableCell = deleteBtn.parentElement;
  const siblingCells = thisTableCell.parentElement.children;
  if (siblingCells.length > 1) {
    const indexOfCol = Array.from(siblingCells).indexOf(thisTableCell);
    const rows = Array.from(document.querySelector('TABLE').querySelectorAll('TR'));
    rows.forEach(row => {
      row.children[indexOfCol].remove();
    })
  }
};

function moveRowTo(btn, destination) {
    const movingRow = btn.parentElement.parentElement;
    const rows = function() {return Array.from(document.querySelector('TBODY').querySelectorAll('TR'))};
    
    const destinationRow = rows[destination - 1];
    rows().indexOf(movingRow) < number ? destinationRow.insertAdjacentElement('afterend', movingRow) : destinationRow.insertAdjacentElement('beforebegin', movingRow);
    
};

//event for dragging row
function dragRow(btn) {
  const movingRow = btn.parentElement;
  const rowIndex = Array.from(tableBody.querySelectorAll('TR')).indexOf(movingRow);
  movingRow.draggable = true;
  movingRow.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData("text/plain", rowIndex);
  });
  movingRow.classList.add('highlight-row');
  
  movingRow.addEventListener('dragend', (e) => {
    let index = 0;
    for (let i  of document.querySelectorAll('TR')) {
      i.classList.remove('bottom-row-insert');
      i.classList.remove('highlight-row');
      i.querySelector('.row-number') ? i.querySelector('.row-number').innerHTML = ++ index : null;
    }
    movingRow.draggable = false;
  });
};

//Add drag and drop listeners to body and header
var tableBody = document.querySelector('TBODY');
var tHead1 = document.querySelector('THEAD').querySelector('TR:last-of-type');

[tableBody, tHead1].forEach(el => {
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.target.closest('TR').classList.add('bottom-row-insert');
  });
  
  el.addEventListener('dragleave', (e) => {
    e.target.closest('TR').classList.remove('bottom-row-insert');
  });
  
  el.addEventListener('drop', (e) => {
    const rowIndex = e.dataTransfer.getData('text/plain');
    if (el === tableBody)
      e.target.closest('TR').insertAdjacentElement('afterend', tableBody.querySelectorAll('TR')[rowIndex]);
    else tableBody.insertAdjacentElement('afterbegin', tableBody.querySelectorAll('TR')[rowIndex]);
  });

})


