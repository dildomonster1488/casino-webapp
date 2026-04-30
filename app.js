// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

let balance = 10000;
let diceType = 'high';

// Слоты
const SLOTS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];

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
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Анимация и спин слотов
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
    
    // Анимация
    const slots = ['slot1', 'slot2', 'slot3'];
    slots.forEach(id => {
        document.getElementById(id).classList.add('spinning');
    });
    
    // Крутим 2 секунды
    for (let i = 0; i < 20; i++) {
        await sleep(100);
        slots.forEach(id => {
            document.getElementById(id).textContent = SLOTS[Math.floor(Math.random() * SLOTS.length)];
        });
    }
    
    // Финальный результат
    const result = slots.map(() => SLOTS[Math.floor(Math.random() * SLOTS.length)]);
    
    slots.forEach((id, i) => {
        document.getElementById(id).classList.remove('spinning');
        document.getElementById(id).textContent = result[i];
    });
    
    // Проверка выигрыша
    let winAmount = 0;
    let message = '';
    
    if (result[0] === result[1] && result[1] === result[2]) {
        let multiplier = 5;
        if (result[0] === '7️⃣') multiplier = 10;
        if (result[0] === '💎') multiplier = 15;
        winAmount = bet * multiplier;
        message = `🎉 ДЖЕКПОТ! x${multiplier}\nВыигрыш: ${winAmount} монет`;
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        winAmount = Math.floor(bet * 1.5);
        message = `✅ Два совпадения! x1.5\nВыигрыш: ${winAmount} монет`;
    } else {
        message = `😔 Не повезло!\nПроигрыш: ${bet} монет`;
    }
    
    balance += winAmount;
    updateBalance();
    showResult('slot-result', message, winAmount > 0);
    
    document.querySelector('.spin-btn').disabled = false;
}

// Бросок кубика
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
    
    // Анимация
    const dice = document.getElementById('dice');
    dice.classList.add('rolling');
    
    const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    for (let i = 0; i < 10; i++) {
        await sleep(150);
        dice.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    }
    
    dice.classList.remove('rolling');
    
    // Результат
    const result = Math.floor(Math.random() * 6) + 1;
    dice.textContent = DICE_FACES[result - 1];
    
    const diceNames = {'high': 'Больше 3', 'low': 'Меньше 4', 'exact': 'Ровно 6'};
    let win = false;
    let multiplier = 0;
    
    if (diceType === 'high' && result > 3) { win = true; multiplier = 1.5; }
    if (diceType === 'low' && result < 4) { win = true; multiplier = 1.5; }
    if (diceType === 'exact' && result === 6) { win = true; multiplier = 5; }
    
    let message = `Выпало: ${result}\n`;
    if (win) {
        const winAmount = Math.floor(bet * multiplier);
        balance += winAmount;
        message += `🎉 Победа! x${multiplier}\nВыигрыш: ${winAmount} монет`;
    } else {
        message += `😔 Не угадали!\nПроигрыш: ${bet} монет`;
    }
    
    updateBalance();
    showResult('dice-result', message, win);
    
    document.querySelector('.roll-btn').disabled = false;
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

// Инициализация
updateBalance();