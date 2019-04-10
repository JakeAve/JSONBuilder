/*
document.querySelector('#save-updates').addEventListener('click', () => {
    document.querySelector('#file-path').innerHTML === '' ? saveAs() : saveFile();
});*/

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
      switch(destination) {
        case 'UP':
          movingRow.previousElementSibling ? movingRow.previousElementSibling.insertAdjacentElement('beforebegin', movingRow) : null;
          break;
        case 'DOWN':
          movingRow.nextElementSibling ? movingRow.nextElementSibling.insertAdjacentElement('afterend', movingRow) : null;
         break;
        default:
          const destinationRow = rows[destination - 1];
          rows().indexOf(movingRow) < number ? destinationRow.insertAdjacentElement('afterend', movingRow) : destinationRow.insertAdjacentElement('beforebegin', movingRow);
      };
      rows().forEach((row, index) => {
        row.querySelector('.row-number').innerHTML = index + 1;
      });
  };

  function highlightRow(btn) {
    const movingRow = btn.parentElement;
    const rowIndex = Array.from(tableBody.querySelectorAll('TR')).indexOf(movingRow);
    //movingRow.draggable = 'true';
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
    });
  };

  function removeHighlight(btn) {
    const movingRow = btn.parentElement.parentElement;
    movingRow.draggable = 'false';
    movingRow.classList.remove('highlight-row');
  };

  var tableBody = document.querySelector('TBODY');

  tableBody.addEventListener('dragover', (e) => {
    e.preventDefault();
    const row = e.target.closest('TR');
    row.classList.add('bottom-row-insert');
  });
  
  tableBody.addEventListener('dragleave', (e) => {
    const row = e.target.closest('TR');
    row.classList.remove('bottom-row-insert');
  });
  
  tableBody.addEventListener('drop', (e) => {
    const rowIndex = e.dataTransfer.getData('text/plain');
    e.target.closest('TR').insertAdjacentElement('afterend', tableBody.querySelectorAll('TR')[rowIndex]);
  });
  
  document.querySelector('THEAD').querySelector('TR:last-of-type').addEventListener('dragover', (e) => {
    e.preventDefault();
    const row = e.target.closest('TR');
    row.classList.add('bottom-row-insert');
  });

  document.querySelector('THEAD').querySelector('TR:last-of-type').addEventListener('dragleave', (e) => {
    e.preventDefault();
    const row = e.target.closest('TR');
    row.classList.remove('bottom-row-insert');
  });

  document.querySelector('THEAD').querySelector('TR:last-of-type').addEventListener('drop', (e) => {
    const rowIndex = e.dataTransfer.getData('text/plain');
    tableBody.insertAdjacentElement('afterbegin', tableBody.querySelectorAll('TR')[rowIndex]);
  });

