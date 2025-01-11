let balls = 0;
let strikes = 0;
let sequence = [];
let isNewAtBat = false;
let previousCount = null; // Private variable to store the previous count state

function updateCountDisplay(result) {
    const countDisplay = document.getElementById('count-display');

    if (result === 'strikeout') {
        countDisplay.textContent = 'Result: K';
    } else if (result === 'walk') {
        countDisplay.textContent = 'Result: BB';
    } else {
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
    previousCount = { balls, strikes };
}

document.getElementById('pitch-button').addEventListener('click', function() {
    const pitchType = document.getElementById('pitch-type').value;
    const handedness = document.getElementById('batter-handedness').value;
    const resultInput = document.getElementById('pitch-result').value.trim().toLowerCase();

    // Allowed results
    const validResults = ['strike', 'ball', 'hit', 'out', 'foul'];

    // Validate result
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

    // Store the current state before making changes
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
        } else {
            updateCountDisplay();
        }
    } else if (result.toLowerCase() === 'foul') {
        if (strikes < 2) {
            strikes++;
        }
        updateCountDisplay();
    } else if (result.toLowerCase() === 'ball') {
        balls++;
        if (balls >= 4) {
            updateCountDisplay('walk');
            isNewAtBat = true;
        } else {
            updateCountDisplay();
        }
    } else if (['hit', 'out'].includes(result.toLowerCase())) {
        isNewAtBat = true;
    }

    document.getElementById('pitch-result').value = '';
});

// Undo last pitch functionality
document.getElementById('undo-button').addEventListener('click', function() {
    const table = document.getElementById('results-table');

    if (table.rows.length > 0) {
        // Get the last row of the table
        const lastRow = table.rows[table.rows.length - 1];

        // Extract the result of the last pitch
        const removedPitch = lastRow.cells[2].textContent.toLowerCase();

        // Remove the last row from the table
        table.deleteRow(table.rows.length - 1);

        console.log(`Removed Pitch: ${removedPitch}`); // Debugging

        // Restore the previous state if available
        if (previousCount) {
            balls = previousCount.balls;
            strikes = previousCount.strikes;
            previousCount = null; // Clear the previous count after restoring
        } else {
            // Adjust the count based on the removed pitch
            if (removedPitch === 'strike') {
                strikes = Math.max(strikes - 1, 0);
            } else if (removedPitch === 'ball') {
                balls = Math.max(balls - 1, 0);
            }
        }

        // Update the sequence based on the table rows
        sequence = Array.from({ length: table.rows.length }, (_, i) => 
            table.rows[i].cells[0].textContent
        );

        // Handle undo after walk or strikeout
        if (isNewAtBat) {
            isNewAtBat = false;
        }

        // Debugging counts
        console.log(`Balls after undo: ${balls}, Strikes after undo: ${strikes}`);
        console.log(`Sequence after undo: ${sequence}`);

        // Update the sequence and count displays
        updateSequenceDisplay();
        updateCountDisplay();
    } else {
        alert('No pitch to undo!');
    }
});
