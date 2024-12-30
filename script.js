window.onload = function() {
    cleanOldData();
    updateHistory();
};

function cleanOldData() {
    const raffleData = JSON.parse(localStorage.getItem('raffleHistory') || '[]');
    let needsUpdate = false;
    
    raffleData.forEach((raffle, index) => {
        if (!raffle.allParticipants || !raffle.participantCount) {
            raffleData[index] = {
                purpose: raffle.purpose,
                date: raffle.date,
                winners: raffle.winners,
                allParticipants: raffle.winners,
                participantCount: raffle.winners.length,
                winnerCount: raffle.winners.length
            };
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        localStorage.setItem('raffleHistory', JSON.stringify(raffleData));
    }
}

function runRaffle() {
    if (!validateInput()) return;
    
    const purpose = document.getElementById('rafflePurpose').value.trim();
    const participantCount = parseInt(document.getElementById('participantCount').value);
    const winnerCount = parseInt(document.getElementById('winnerCount').value);
    const participants = document.getElementById('participantList').value.trim().split('\n').filter(name => name.trim() !== '');

    if (!purpose || isNaN(participantCount) || isNaN(winnerCount) || participants.length < winnerCount) {
        alert('נא למלא את כל השדות כראוי.');
        return;
    }

    const winners = [];
    const availableParticipants = [...participants];
    while (winners.length < winnerCount) {
        const randomIndex = Math.floor(Math.random() * availableParticipants.length);
        winners.push(availableParticipants.splice(randomIndex, 1)[0]);
    }

    const date = new Date();
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class='result-item'>
            <strong>הזוכים:</strong> 
            <button onclick="copyWinners(this)" class="copy-button">העתק</button>
            <span id="winnersList">${winners.join(', ')}</span>
        </div>`;

    saveRaffle(purpose, formattedDate, winners);
}

function saveRaffle(purpose, date, winners) {
    const raffleData = JSON.parse(localStorage.getItem('raffleHistory') || '[]');
    const allParticipants = document.getElementById('participantList').value.trim().split('\n').filter(name => name.trim() !== '');
    
    const newRaffle = {
        purpose,
        date,
        winners,
        allParticipants,
        participantCount: allParticipants.length,
        winnerCount: winners.length
    };
    
    raffleData.push(newRaffle);
    localStorage.setItem('raffleHistory', JSON.stringify(raffleData));
    updateHistory();
}

function updateHistory() {
    const historyDiv = document.getElementById('history');
    const raffleData = JSON.parse(localStorage.getItem('raffleHistory') || '[]');

    historyDiv.innerHTML = `
        <div class="history-header">
            <h2>הגרלות קודמות</h2>
            <button onclick="clearHistory()" class="clear-button">נקה היסטוריה</button>
        </div>`;
    
    raffleData.forEach((raffle, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-actions">
                <button onclick="deleteRaffle(${index})" class="delete-button">×</button>
                <button onclick="reloadRaffle(${index})" class="reload-button" title="טען נתונים מהגרלה זו">&#8635;</button>
            </div>
            <strong>${sanitizeInput(raffle.purpose)}</strong> (${raffle.date})<br>
            זוכים: ${raffle.winners.map(winner => sanitizeInput(winner)).join(', ')}`;
        historyDiv.appendChild(item);
    });
}

function deleteRaffle(index) {
    if (confirm('האם אתה בטוח שברצונך למחוק הגרלה זו?')) {
        const raffleData = JSON.parse(localStorage.getItem('raffleHistory') || '[]');
        raffleData.splice(index, 1);
        localStorage.setItem('raffleHistory', JSON.stringify(raffleData));
        updateHistory();
    }
}

function clearHistory() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?')) {
        localStorage.removeItem('raffleHistory');
        updateHistory();
    }
}

function reloadRaffle(index) {
    const raffleData = JSON.parse(localStorage.getItem('raffleHistory') || '[]');
    const raffle = raffleData[index];
    
    if (raffle && raffle.allParticipants) {
        document.getElementById('rafflePurpose').value = raffle.purpose;
        document.getElementById('participantList').value = raffle.allParticipants.join('\n');
        document.getElementById('participantCount').value = raffle.participantCount;
        document.getElementById('winnerCount').value = raffle.winnerCount;
        updateParticipantCount();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateParticipantCount() {
    const participantList = document.getElementById('participantList').value.trim();
    const totalRequired = parseInt(document.getElementById('participantCount').value) || 0;
    const currentCount = participantList ? participantList.split('\n').filter(name => name.trim() !== '').length : 0;
    
    document.getElementById('participantCounter').textContent = currentCount;
    document.getElementById('totalParticipants').textContent = totalRequired;
    
    const counterSpan = document.getElementById('participantCounter');
    if (currentCount > totalRequired) {
        counterSpan.style.color = 'red';
    } else if (currentCount === totalRequired) {
        counterSpan.style.color = 'green';
    } else {
        counterSpan.style.color = '#333';
    }
}

function copyWinners(button) {
    const winnersText = document.getElementById('winnersList').textContent;
    navigator.clipboard.writeText(winnersText).then(() => {
        button.textContent = '✓ הועתק';
        button.classList.add('copy-success');
        setTimeout(() => {
            button.textContent = 'העתק';
            button.classList.remove('copy-success');
        }, 2000);
    }).catch(err => {
        alert('שגיאה בהעתקה: ' + err);
    });
}

function importCSV(input) {
    const file = input.files[0];
    const maxSize = 1024 * 1024;
    if (file) {
        if (file.size > maxSize) {
            alert('הקובץ גדול מדי. גודל מקסימלי הוא 1MB (בערך 50,000 שורות)');
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const participants = e.target.result.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
                document.getElementById('participantList').value = participants.join('\n');
                document.getElementById('participantCount').value = participants.length;
                updateParticipantCount();
                alert('רשימת המשתתפים יובאה בהצלחה!');
            } catch (err) {
                alert('שגיאה בייבוא הקובץ');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }
    input.value = '';
}

function sanitizeInput(input) {
    return input.replace(/[<>]/g, '');
}

function validateInput() {
    const purpose = document.getElementById('rafflePurpose').value.trim();
    const participantCount = parseInt(document.getElementById('participantCount').value);
    const winnerCount = parseInt(document.getElementById('winnerCount').value);
    
    if (!purpose) {
        alert('נא להזין מטרת הגרלה');
        return false;
    }
    
    if (winnerCount > participantCount) {
        alert('מספר הזוכים לא יכול להיות גדול ממספר המשתתפים');
        return false;
    }
    
    if (winnerCount <= 0 || participantCount <= 0) {
        alert('מספר המשתתפים והזוכים חייב להיות גדול מ-0');
        return false;
    }
    
    return true;
}

document.getElementById('participantCount').addEventListener('input', updateParticipantCount); 
