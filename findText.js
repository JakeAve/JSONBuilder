const { ipcRenderer } = require('electron')


const findContainer = document.createElement('div');
findContainer.classList.add('find-container', 'hidden');
findContainer.innerHTML = `
    <input id="find-input">
    <div id="matches">0/0</div>
    <button>&lt;</button>
    <button>&gt;</button>
    <button id="hide-find">x</button>
`;


document.body.appendChild(findContainer);

function showFind() {
    findContainer.classList.remove('hidden');
    findContainer.querySelector('#find-input').focus();
}

document.querySelector('#hide-find').addEventListener('click', () => {
    findContainer.classList.add('hidden');
    findText('');
})

document.querySelector('#find-input').addEventListener('keyup', (e) => findText(e.target.value))

function findText(value) {
    const patt = `(${value})`
    const re = new RegExp(patt, 'gi');
    const cells = document.querySelector('table').querySelectorAll('td[contenteditable], th[contenteditable]');
    for (let cell of cells) {
        if (value)
            cell.innerHTML = cell.textContent.replace(re, (wholeMatch, firstMatch) => {
                return `<mark>${firstMatch}</mark>`
            })
        else  cell.innerHTML = cell.textContent.replace(/<\/?mark>/g, '')
    }
    if (value) 
        getMatches();
}

function getMatches() {
    const markTags = document.querySelector('table').querySelectorAll('mark');
    const elements = Array.from(markTags);
    const matches = elements.map((el, index) => {
        return {
            ['element'] : el, 
            index, 
            ['pos'] :el.getBoundingClientRect().top
            }
    })

    return matches;

    console.log(matches);
    function getTopMatch() {
        let topMatch = matches[0];
        let index = 0;
        while (topMatch.pos < 0) {
            topMatch = matches[index ++]
        }
        return topMatch;
    }
    const topMatch = matches.length ? getTopMatch() : null;

    document.querySelector('#matches').innerHTML = `${topMatch ? topMatch.index + 1 : 0} / ${matches.length}`;
}



ipcRenderer.on('find', showFind);


document.addEventListener('dom-ready', () => {
    setUpFind();
});
