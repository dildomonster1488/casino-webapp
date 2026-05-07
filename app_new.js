cat > app.js << 'EOF'
let balance = 10000;
let diceType = 'high';
let isInTelegram = false;

// Определяем где запущено приложение
if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    isInTelegram = true;
}

// Инициализация
function initApp() {
    if (isInTelegram) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Показываем загрузку
        document.getElementById('balance').textContent = '...';
        
        // Запрашиваем баланс
        tg.sendData(JSON.stringify({
            action: 'get_balance',
            amount: 0
        }));
    } else {
        // Тест в браузере
        const saved = localStorage.getItem('casino_balance');
        if (saved) {
            balance = parseInt(saved);
        }
        updateBalanceDisplay();
    }
}

// Запускаем при загрузке
window.addEventListener('load', initApp);

function updateBalanceDisplay() {
    document.getElementById('balance').textContent = balance;
}

function syncBalance() {
    if (isInTelegram) {
        window.Telegram.WebApp.sendData(JSON.stringify({
            action: 'update_balance',
            amount: balance
        }));
    } else {
        localStorage.setItem('casino_balance', balance);
    }
}

function validateBet(input) {
    const bet = parseInt(input.value);
    if (isNaN(bet) || bet < 10) input.value = 10;
    if (bet > balance) input.value = balance;
}

function setBet(amount) {
    const input = document.getElementById('slot-bet');
    input.value = amount;
}

function setDiceBet(amount) {
    const input = document.getElementById('dice-bet');
    input.value = amount;
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
    
    document.getElementById('nav-slots').classList.remove('active');
    document.getElementById('nav-dice').classList.remove('active');
    
    if (screen === 'slots') {
        document.getElementById('nav-slots').classList.add('active');
    } else {
        document.getElementById('nav-dice').classList.add('active');
    }
}

function showResult(elementId, message, isWin) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = 'result ' + (isWin ? 'win' : 'lose');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const SLOTS = ['🦫', '🍋', '🍊', '🍇', '💎', '7️⃣'];

async function spinSlots() {
    const spinBtn = document.getElementById('spin-button');
    const betInput = document.getElementById('slot-bet');
    const bet = parseInt(betInput.value);
    
    if (!bet || bet < 10) {
        showResult('slot-result', '❌ Минимальная ставка: 10 монет!', false);
        return;
    }
    
    if (bet > balance) {
        showResult('slot-result', '❌ Недостаточно монет!', false);
        return;
    }
    
    spinBtn.disabled = true;
    balance -= bet;
    updateBalanceDisplay();
    
    // Анимация
    for (let i = 0; i < 10; i++) {
        await sleep(100);
        document.getElementById('slot1').textContent = SLOTS[Math.floor(Math.random() * SLOTS.length)];
        document.getElementById('slot2').textContent = SLOTS[Math.floor(Math.random() * SLOTS.length)];
        document.getElementById('slot3').textContent = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    }
    
    // Результат
    const r1 = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const r2 = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const r3 = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    
    document.getElementById('slot1').textContent = r1;
    document.getElementById('slot2').textContent = r2;
    document.getElementById('slot3').textContent = r3;
    
    let winAmount = 0;
    let message = '';
    
    if (r1 === r2 && r2 === r3) {
        let mult = 5;
        if (r1 === '7️⃣') mult = 10;
        if (r1 === '💎') mult = 15;
        winAmount = bet * mult;
        message = '🎉 ДЖЕКПОТ! x' + mult + '\nВыигрыш: ' + winAmount + ' монет';
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        winAmount = Math.floor(bet * 1.5);
        message = '✅ Два совпадения! x1.5\nВыигрыш: ' + winAmount + ' монет';
    } else {
        message = '😔 Не повезло!\nПроигрыш: ' + bet + ' монет';
    }
    
    balance += winAmount;
    updateBalanceDisplay();
    syncBalance();
    showResult('slot-result', message, winAmount > 0);
    spinBtn.disabled = false;
}

async function rollDice() {
    const rollBtn = document.getElementById('roll-button');
    const betInput = document.getElementById('dice-bet');
    const bet = parseInt(betInput.value);
    
    if (!bet || bet < 10) {
        showResult('dice-result', '❌ Минимальная ставка: 10 монет!', false);
        return;
    }
    
    if (bet > balance) {
        showResult('dice-result', '❌ Недостаточно монет!', false);
        return;
    }
    
    rollBtn.disabled = true;
    balance -= bet;
    updateBalanceDisplay();
    
    const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    // Анимация
    for (let i = 0; i < 10; i++) {
        await sleep(80);
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
        message += '😔 Не угадали!\nПроигрыш: ' + bet + ' монет';
    }
    
    updateBalanceDisplay();
    syncBalance();
    showResult('dice-result', message, win);
    rollBtn.disabled = false;
}

// Показываем баланс сразу
updateBalanceDisplay();
EOF
