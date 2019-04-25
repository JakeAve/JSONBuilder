const { ipcRenderer } = require('electron')

//make and append the html to the document body
const findBar = document.createElement('div');
findBar.classList.add('find-bar', 'hidden');
findBar.innerHTML = `
    <input id="find-input">
    <div id="matches">0/0</div>
    <button title="Previous">&lt;</button>
    <button title="Next">&gt;</button>
    <button id="hide-find" title="Close find bar">x</button>
`;

document.body.appendChild(findBar);

function showFind() {
    findBar.classList.remove('hidden');
    findBar.querySelector('#find-input').focus();
    findBar.querySelector('#find-input').select();
}

//this object handles all the matches
const matchesObj = {
    fullArray : [], //each object in the array contains the element, index, el.getBoudingClientRect().top

    currentIndex : 0,

    get selectedMatch() {
        return this.fullArray[this.currentIndex] || null
    },

    earlierMatch : null,
    set earlierMatchIndex(index) {
        this.earlierMatch = this.fullArray[index];
    },

    //creates an array of all the matches
    getMatches : function () {
        const markTags = document.querySelector('table').querySelectorAll('mark');
        const elements = Array.from(markTags);
        if (elements.length) {
            const matches = elements.map(el => {
                return {
                    ['element'] : el,
                    ['pos'] :el.getBoundingClientRect().top
                }
            })
            this.fullArray = matches;
            this.identifyTopMatch();
        } else 
            this.resetFindBar();
    },

    //finds and selects the match that is closest to the top of the viewport
    identifyTopMatch : function () {
        if (this.fullArray.length) {
            const matches = this.fullArray;
            let topMatch = matches[0];
            let index = 0;
            while (topMatch.pos < 0 && index < this.fullArray.length - 1) {
                topMatch = matches[index ++]
            }
            this.currentIndex = index === 0 ? 0 : index --;
            this.jumpToMatch();
        }
    },

    updateDisplay : function () {
        document.querySelector('#matches').innerHTML = `${this.selectedMatch ? this.currentIndex + 1 : 0} / ${this.fullArray.length}`;
    },

    nextMatch : function () {
        if (this.currentIndex < this.fullArray.length - 1)
            this.currentIndex ++;
        else
            this.currentIndex = 0;
        this.jumpToMatch();
    },
    previousMatch : function () {
        if (this.currentIndex > 0)
            this.currentIndex --;
        else 
            this.currentIndex = this.fullArray.length - 1;
        this.jumpToMatch();
    },

    //scrolls the match into view and handles the selected coloring
    jumpToMatch : function () {
        if (this.selectedMatch) {
            this.selectedMatch.element.scrollIntoView();
            window.scrollBy(0, -100);
            this.selectedMatch.element.classList.add('selected-mark');
            //handles taking away the '.selected-mark' class from the previously selected match
            this.earlierMatch ? this.earlierMatch.element.classList.remove('selected-mark') : null;
            this.earlierMatchIndex = this.currentIndex;
        }
        this.updateDisplay();
    },

    resetFindBar : function () { //zeros out the find bar
        this.fullArray = [];
        this.currentIndex = 0;
        this.updateDisplay();
    }
}

function findText(value) {
    const patt = `(${value})`
    const re = new RegExp(patt, 'gi');
    const cells = document.querySelector('table').querySelectorAll('td[contenteditable], th[contenteditable]');
    for (let cell of cells) {
        if (value)
            cell.innerHTML = cell.textContent.replace(re, (wholeMatch, firstMatch) => {
                return `<mark>${firstMatch}</mark>`
            })
        //when there is no text, it gets rid of all mark tags
        else  cell.innerHTML = cell.textContent.replace(/<\/?mark.*?>/g, '')
    }
    if (value) 
        matchesObj.getMatches();
    else 
        matchesObj.resetFindBar();
}

document.querySelector('#hide-find').addEventListener('click', () => {
    findBar.classList.add('hidden');
    findText('');
})

const map = {}; // for key presses
document.querySelector('#find-input').addEventListener('keyup', (e) => {
    if (e.keyCode === 13 || e.keyCode === 16) { //ENTER or SHIFT
        onkeydown = onkeyup = (e) => {
            map[e.keyCode] = e.type == 'keydown';
            if (map[13] && map[16]) //SHIFT + ENTER
                matchesObj.previousMatch()
            else if (map[13]) //ENTER
                //the first time you press ENTER, it doesn't work. But it works as expected every other time
                matchesObj.nextMatch()
        }
    } else 
        findText(e.target.value)
})

const arrowBtns = findBar.querySelectorAll('button:not(last-of-type)');

arrowBtns[0].addEventListener('click', () => {
    matchesObj.previousMatch()
})

arrowBtns[1].addEventListener('click', () => {
    matchesObj.nextMatch()
})

//the event is triggered in the main process
ipcRenderer.on('find', showFind);

document.addEventListener('dom-ready', () => {
    setUpFind();
});
