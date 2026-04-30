cd ~/casino_bot/web
cat > app.js << 'EOF'
const tg = window.Telegram.WebApp;
tg.expand();

let balance = 10000;
let diceType = 'high';

// Инициализация - получаем данные из Telegram
const initData = tg.initDataUnsafe;
if (initData && initData.user) {
    // Отправляем запрос на получение баланса
    tg.sendData(JSON.stringify({
        action: 'get_balance',
        amount: 0
    }));
}

// Получаем ответ от бота
tg.onEvent('web_app_data', function(data) {
    try {
        const response = JSON.parse(data.data);
        if (response.status === 'ok' && response.balance !== undefined) {
            balance = response.balance;
            updateBalance();
        }
    } catch(e) {}
});

function setBet(amount) {
    document.getElementById('slot-bet').value = amount;
}

function setDiceBet(amount) {
    document.getElementById('dice-bet').value = amount;
}

function setDiceType(type) {
    diceType = type;
    document.querySelectorAll('.dice-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function showScreen(screen) {
    document.getElementById('slots-screen').style.display = screen === 'slots' ? 'block' : 'none';
    document.getElementById('dice-screen').style.display = screen === 'dice' ? 'block' : 'none';
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function updateBalance() {
    document.getElementById('balance').textContent = balance;
}

function syncBalance() {
    // Отправляем новый баланс боту
    tg.sendData(JSON.stringify({
        action: 'update_balance',
        amount: balance
    }));
}

function showResult(elementId, message, isWin) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = 'result ' + (isWin ? 'win' : 'lose');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const SLOTS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];

async function spinSlots() {
    const bet = parseInt(document.getElementById('slot-bet').value);
    
    if (bet < 10) {
        showResult('slot-result', 'Минимальная ставка: 10 монет!', false);
        return;
    }
    
    if (bet > balance) {
        showResult('slot-result', 'Недостаточно монет!', false);
        return;
    }
    
    document.querySelector('.spin-btn').disabled = true;
    balance -= bet;
    updateBalance();
    
    for (let i = 0; i < 10; i++) {
        await sleep(150);
        document.getElementById('slot1').textContent = SLOTS[Math.floor(Math.random() * 6)];
        document.getElementById('slot2').textContent = SLOTS[Math.floor(Math.random() * 6)];
        document.getElementById('slot3').textContent = SLOTS[Math.floor(Math.random() * 6)];
    }
    
    const r = [SLOTS[Math.floor(Math.random() * 6)], SLOTS[Math.floor(Math.random() * 6)], SLOTS[Math.floor(Math.random() * 6)]];
    document.getElementById('slot1').textContent = r[0];
    document.getElementById('slot2').textContent = r[1];
    document.getElementById('slot3').textContent = r[2];
    
    let winAmount = 0;
    let message = '';
    
    if (r[0] === r[1] && r[1] === r[2]) {
        let mult = 5;
        if (r[0] === '7️⃣') mult = 10;
        if (r[0] === '💎') mult = 15;
        winAmount = bet * mult;
        message = '🎉 ДЖЕКПОТ! x' + mult + '\nВыигрыш: ' + winAmount + ' монет';
    } else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) {
        winAmount = Math.floor(bet * 1.5);
        message = '✅ Два совпадения! x1.5\nВыигрыш: ' + winAmount + ' монет';
    } else {
        message = '😔 Не повезло!';
    }
    
    balance += winAmount;
    updateBalance();
    syncBalance(); // Отправляем баланс боту
    showResult('slot-result', message, winAmount > 0);
    document.querySelector('.spin-btn').disabled = false;
}

async function rollDice() {
    const bet = parseInt(document.getElementById('dice-bet').value);
    
    if (bet < 10) {
        showResult('dice-result', 'Минимальная ставка: 10 монет!', false);
        return;
    }
    
    if (bet > balance) {
        showResult('dice-result', 'Недостаточно монет!', false);
        return;
    }
    
    document.querySelector('.roll-btn').disabled = true;
    balance -= bet;
    updateBalance();
    
    const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    for (let i = 0; i < 10; i++) {
        await sleep(100);
        document.getElementById('dice').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    }
    
    const result = Math.floor(Math.random() * 6) + 1;
    document.getElementById('dice').textContent = DICE_FACES[result - 1];
    
    let win = false;
    let mult = 0;
    
    if (diceType === 'high' && result > 3) { win = true; mult = 1.5; }
    if (diceType === 'low' && result < 4) { win = true; mult = 1.5; }
    if (diceType === 'exact' && result === 6) { win = true; mult = 5; }
    
    let message = 'Выпало: ' + result + '\n';
    
    if (win) {
        const winAmount = Math.floor(bet * mult);
        balance += winAmount;
        message += '🎉 Победа! x' + mult + '\nВыигрыш: ' + winAmount + ' монет';
    } else {
        message += '😔 Не угадали!';
    }
    
    updateBalance();
    syncBalance(); // Отправляем баланс боту
    showResult('dice-result', message, win);
    document.querySelector('.roll-btn').disabled = false;
}

updateBalance();
EOF