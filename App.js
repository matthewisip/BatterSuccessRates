let balls = 0;
let strikes = 0;
let sequence = [];
let isNewAtBat = false;
let previousCount = null;

function updateCountDisplay(result) {
    const countDisplay = document.getElementById('count-display');
    if (result === 'strikeout') {
        countDisplay.textContent = 'Result: K';
    } 
    else if (result === 'walk') {
        countDisplay.textContent = 'Result: BB';
    } 
    else {
        countDisplay.textContent = `Count: ${balls}-${strikes}`;
    }
}
function updateSequenceDisplay() {
    const sequenceDisplay = document.getElementById('sequence-display');
    sequenceDisplay.textContent = `Sequence: ${sequence.join(' - ')}`;
}
function resetAtBat() {
    balls = 0;
    strikes = 0;
    sequence = [];
    isNewAtBat = true;
}
function storePreviousCount() {
    previousCount = { 
        balls, 
        strikes 
    };
}
document.getElementById('pitch-button').addEventListener('click', function () {
    const pitchType = document.getElementById('pitch-type').value;
    const handedness = document.getElementById('batter-handedness').value;
    const resultInput = document.getElementById('pitch-result').value.trim().toLowerCase();
    const validResults = ['strike', 'ball', 'hit', 'out', 'foul'];
    if (!validResults.includes(resultInput)) {
        alert('Invalid result. Please enter one of the following: Strike, Ball, Hit, Out, Foul');
        document.getElementById('pitch-result').value = '';
        return;
    }
    const result = resultInput.charAt(0).toUpperCase() + resultInput.slice(1);
    if (isNewAtBat) {
        resetAtBat();
        const table = document.getElementById('results-table');
        while (table.rows.length > 0) {
            table.deleteRow(0);
        }
        isNewAtBat = false;
    }
    storePreviousCount();

    const table = document.getElementById('results-table');
    const newRow = table.insertRow();
    const pitchTypeCell = newRow.insertCell(0);
    const handednessCell = newRow.insertCell(1);
    const resultCell = newRow.insertCell(2);
    pitchTypeCell.textContent = pitchType;
    handednessCell.textContent = handedness;
    resultCell.textContent = result;
    sequence.push(pitchType);
    updateSequenceDisplay();
    if (result.toLowerCase() === 'strike') {
        strikes++;
        if (strikes >= 3) {
            updateCountDisplay('strikeout');
            isNewAtBat = true;
        } 
        else {
            updateCountDisplay();
        }
    } 
    else if (result.toLowerCase() === 'foul') {
        if (strikes < 2) {
            strikes++;
        }
        updateCountDisplay();
    } 
    else if (result.toLowerCase() === 'ball') {
        balls++;
        if (balls >= 4) {
            updateCountDisplay('walk');
            isNewAtBat = true;
        } 
        else {
            updateCountDisplay();
        }
    } 
    else if (['hit', 'out'].includes(result.toLowerCase())) {
        isNewAtBat = true;
    }
    document.getElementById('pitch-result').value = '';
});
document.getElementById('undo-button').addEventListener('click', function () {
    const table = document.getElementById('results-table');
    if (table.rows.length > 0) {
        const lastRow = table.rows[table.rows.length - 1];
        const removedPitch = lastRow.cells[2].textContent.toLowerCase();
        table.deleteRow(table.rows.length - 1);
        if (previousCount) {
            balls = previousCount.balls;
            strikes = previousCount.strikes;
            previousCount = null;
        } 
        else {
            if (removedPitch === 'strike') {
                strikes = Math.max(strikes - 1, 0);
            } 
            else if (removedPitch === 'ball') {
                balls = Math.max(balls - 1, 0);
            }
        }
        sequence = Array.from({ length: table.rows.length }, (_, i) =>
            table.rows[i].cells[0].textContent
        );
        if (isNewAtBat) {
            isNewAtBat = false;
        }
        updateSequenceDisplay();
        updateCountDisplay();
    } 
    else {
        alert('No pitch to undo!');
    }
});
const sidebar = document.getElementById('sidebar');
const container = document.querySelector('.container');
const toggleButton = document.getElementById('toggle-sidebar-button');
const restoreButtonContainer = document.getElementById('restore-button-container');

const restoreButton = document.createElement('button');
restoreButton.id = 'restore-sidebar-button';
restoreButton.innerHTML = '&raquo;';
restoreButton.style.display = 'none';
restoreButtonContainer.appendChild(restoreButton);

toggleButton.addEventListener('click', () => {
    sidebar.classList.add('minimized');
    container.classList.add('minimized');
    toggleButton.style.display = 'none';
    restoreButton.style.display = 'flex';
});

restoreButton.addEventListener('click', () => {
    sidebar.classList.remove('minimized');
    container.classList.remove('minimized');
    toggleButton.style.display = 'flex';
    restoreButton.style.display = 'none';
});
