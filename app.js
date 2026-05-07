cat > app.js << 'EOF'
// Ждём загрузки Telegram WebApp
window.addEventListener('load', function() {
    initApp();
});

let balance = 10000;
let diceType = 'high';
let tg = null;

function initApp() {
    // Проверяем что Telegram WebApp доступен
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        tg = Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Запрашиваем баланс у бота
        tg.sendData(JSON.stringify({
            action: 'get_balance',
            amount: 0
        }));
        
        // Слушаем ответ от бота
        tg.onEvent('webAppDataReceived', function(eventData) {
            if (eventData && eventData.data) {
                try {
                    const response = JSON.parse(eventData.data);
                    if (response.balance !== undefined) {
                        balance = parseInt(response.balance);
                        updateBalance();
                    }
                } catch(e) {
                    console.log('Parse error:', e);
                }
            }
        });
    }
    
    // Если не в Telegram (тест в браузере) - используем localStorage
    if (!tg) {
        const savedBalance = localStorage.getItem('casino_balance');
        if (savedBalance) {
            balance = parseInt(savedBalance);
        }
        updateBalance();
    }
}

function saveBalance() {
    if (tg) {
        // Отправляем боту
        tg.sendData(JSON.stringify({
            action: 'update_balance',
            amount: balance
        }));
    } else {
        // Сохраняем локально для тестов
        localStorage.setItem('casino_balance', balance);
    }
}

function validateBet(input) {
    const bet = parseInt(input.value);
    if (bet < 10) input.value = 10;
    if (bet > balance) input.value = balance;
}

function setBet(amount) {
    const input = document.getElementById('slot-bet');
    input.value = amount;
    validateBet(input);
}

function setDiceBet(amount) {
    const input = document.getElementById('dice-bet');
    input.value = amount;
    validateBet(input);
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

function updateBalance() {
    document.getElementById('balance').textContent = balance;
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
    updateBalance();
    
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
        message = '🎉 ДЖЕКПОТ! x' + mult + ' 🎉\nВыигрыш: ' + winAmount + ' монет';
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        winAmount = Math.floor(bet * 1.5);
        message = '✅ Два совпадения! x1.5\nВыигрыш: ' + winAmount + ' монет';
    } else {
        message = '😔 Не повезло!\nПроигрыш: ' + bet + ' монет';
    }
    
    balance += winAmount;
    updateBalance();
    saveBalance();
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
    updateBalance();
    
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
    
    updateBalance();
    saveBalance();
    showResult('dice-result', message, win);
    rollBtn.disabled = false;
}

updateBalance();
EOF