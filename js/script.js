const dice = document.querySelector('.dice');
const rollBtn = document.querySelector('.action-button');
const resultEl = document.getElementById('result');
const scoreEl = document.getElementById('score-value');
const cardsContainer = document.getElementById('cards');

const randomDice = () => {
    // Genera un número entero entre 1 y 6 (inclusive)
    return Math.floor(Math.random() * 6) + 1;
}

const rollDice = random => {
    // Desactivar botón mientras el dado "rueda"
    rollBtn.disabled = true;
    rollBtn.style.opacity = '0.6';

    // Al iniciar el rodado ocultamos las tarjetas (no se pueden usar durante el movimiento)
    if (cardsContainer) cardsContainer.style.display = 'none';

    dice.style.animation = 'rolling 4s';

    setTimeout(() => {
        switch (random) {
            case 1:
                dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
                break;
            case 6:
                dice.style.transform = 'rotateX(180deg) rotateY(0deg)';
                break;
            case 2:
                dice.style.transform = 'rotateX(-90deg) rotateY(0deg)';
                break;
            case 5:
                dice.style.transform = 'rotateX(90deg) rotateY(0deg)';
                break;
            case 3:
                dice.style.transform = 'rotateX(0deg) rotateY(90deg)';
                break;
            case 4:
                dice.style.transform = 'rotateX(0deg) rotateY(-90deg)';
                break;
            default:
                break;
        }

            // Actualizar resultado visible
            if (resultEl) {
                resultEl.textContent = random;
            }

            dice.style.animation = 'none';

            // Si hay una operación pendiente (elegida en la tirada anterior), aplicarla
            if (pendingOp !== null) {
                applyOperation(pendingOp, random);
                pendingOp = null;
                // Después de aplicar la operación, si aún hay operaciones disponibles, mostrar tarjetas
                if (availableOps.length > 0) {
                    if (cardsContainer) cardsContainer.style.display = 'flex';
                    renderCards(random);
                } else {
                    // No quedan operaciones, iniciar nivel 2
                    setTimeout(() => {
                        startLevel2();
                    }, 1000);
                }
            } else {
                // Si es la primera tirada, inicializamos el score con este valor
                if (score === null) {
                    score = random;
                    updateScoreDisplay();
                }
                // Mostrar tarjetas para elegir la operación que se aplicará con la siguiente tirada
                if (availableOps.length > 0) {
                    if (cardsContainer) cardsContainer.style.display = 'flex';
                    renderCards(random);
                }
            }

        // Reactivar botón
        rollBtn.disabled = false;
        rollBtn.style.opacity = '';

    }, 4050);

}

rollBtn.addEventListener('click', () => {
    const n = randomDice();
    rollDice(n);
});

// --- Game state for score and available operations ---
// `score` is null until the first roll — this avoids multiplying by 0
let score = null;
// availableOps will hold the operations currently available as strings
let availableOps = ['+', '-', '×', '÷'];
let pendingOp = null; // holds the operation chosen that will be applied with the next roll

// --- Level 2 (Card Prediction Game) state ---
let gameLevel = 1; // 1 = dice game, 2 = card prediction game, 3 = coin flip betting
let currentCard = null; // The current card value shown
let roundsRemaining = 10; // 10 rounds in level 2
let level2Started = false;

// --- Level 3 (Coin Flip Betting) state ---
let level3Started = false;
let coinFlipsRemaining = 5; // 5 flips máximo
let currentBet = 0;
let selectedCoin = null; // 'cara' o 'sello'
let isFirstFlip = true; // Primera tirada es obligatoria

// UI helper: update .game-screen level class to change background per level
function setGameScreenLevel(level) {
    try {
        const gs = document.querySelector('.game-screen');
        if (!gs) return;
        gs.classList.remove('level-1','level-2','level-3');
        gs.classList.add(`level-${level}`);
    } catch (e) {
        // noop — this is purely visual
    }
}

function updateScoreDisplay() {
    if (!scoreEl) return;
    scoreEl.textContent = formatScoreValue(score);
}

// Formatea el número del score: redondea a 2 decimales y quita ceros innecesarios
function formatScoreValue(val) {
    if (val === null || typeof val === 'undefined') return '0';
    // Redondear a 2 decimales para evitar errores de coma flotante
    const rounded = Math.round(Number(val) * 100) / 100;
    // Usar toFixed y coaccionar a número para eliminar ceros finales innecesarios
    return (+rounded.toFixed(2)).toString();
}

function renderCards(value) {
    console.log('renderCards llamado, cardsContainer:', cardsContainer);
    if (!cardsContainer) {
        console.error('cardsContainer no encontrado!');
        return;
    }
    // Clear existing cards
    cardsContainer.innerHTML = '';

    // Allow one selection per roll
    let selectionMade = false;

    // Map operations to image files
    const opImages = {
        '+': 'assets/ui/level1/btn-plus.png',
        '-': 'assets/ui/level1/btn-minus.png',
        '×': 'assets/ui/level1/btn-times.png',
        '÷': 'assets/ui/level1/btn-divide.png'
    };

    console.log('Operaciones disponibles:', availableOps);

    // Render only the currently available operations
    availableOps.forEach(op => {
        const btn = document.createElement('button');
        btn.className = 'card';
        btn.type = 'button';
        btn.setAttribute('data-op', op);

        // Create image instead of text
        const img = document.createElement('img');
        img.src = opImages[op];
        img.alt = op;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        btn.appendChild(img);

        console.log('Botón creado para operación:', op);

        btn.addEventListener('click', () => {
            // Prevent multiple selections in the same roll
            if (selectionMade) return;
            // If the op was already removed, ignore
            if (!availableOps.includes(op)) return;

            selectionMade = true;

            // Set the pending operation to be applied with the next roll
            pendingOp = op;
            // Remove the chosen operation permanently
            availableOps = availableOps.filter(x => x !== op);

            // Re-render to remove the selected card immediately
            renderCards(value);

            // Ocultar tarjetas mientras se hace el siguiente rodado automático
            if (cardsContainer) cardsContainer.style.display = 'none';

            // Auto-tirar otra vez después de un pequeño retraso para que el usuario vea el resultado
            setTimeout(() => {
                const next = randomDice();
                rollDice(next);
            }, 700);
        });

        cardsContainer.appendChild(btn);
    });

    console.log('Total de botones agregados:', cardsContainer.children.length);
    console.log('Display del cardsContainer:', cardsContainer.style.display);

    // If no operations left, show a small message
    if (availableOps.length === 0) {
        const note = document.createElement('div');
        note.style.fontSize = '12px';
        note.style.color = '#888';
        note.style.marginTop = '6px';
        note.textContent = 'No operations left';
        cardsContainer.appendChild(note);
    }
}

function applyOperation(op, value) {
    const v = Number(value);
    switch (op) {
        case '+':
            score = score + v;
            break;
        case '-':
            score = score - v;
            break;
        case '×':
            score = score * v;
            break;
        case '÷':
            // Avoid division by zero
            if (v === 0) break;
            // Usar división en punto flotante; no truncar para permitir decimales
            score = score / v;
            break;
        default:
            break;
    }
    // Redondear el score a 2 decimales para evitar acumulación de errores flotantes
    if (typeof score === 'number' && !Number.isNaN(score)) {
        score = Math.round(score * 100) / 100;
    }
    // Restringir score a valores no negativos (0 o positivos)
    if (typeof score !== 'number' || Number.isNaN(score)) score = 0;
    if (score < 0) score = 0;
    updateScoreDisplay();
}

// ========== LEVEL 2: Card Prediction Game ==========

function startLevel2() {
    gameLevel = 2;
    level2Started = true;
    roundsRemaining = 10;
    // Update visual background for level 2
    setGameScreenLevel(2);
    
    // Update header image for level 2
    const headerImg = document.querySelector('.header-image');
    if (headerImg) {
        headerImg.src = 'assets/ui/level2/header-level2.png';
        headerImg.alt = 'Nivel 2';
    }
    
    // Update level counter
    const levelValue = document.getElementById('level-value');
    if (levelValue) levelValue.textContent = '2';
    
    // Ocultar el dado y su contenedor
    const diceContainer = document.querySelector('.dice-container');
    if (diceContainer) diceContainer.style.display = 'none';
    
    // Ocultar el botón de roll dice
    rollBtn.style.display = 'none';
    
    // Ocultar resultado del dado
    if (resultEl) resultEl.style.display = 'none';
    
    // Expandir contenedor para nivel 2
    const container = document.querySelector('.container');
    if (container) container.classList.add('wide');
    
    // Generar primera carta random [1-10]
    currentCard = Math.floor(Math.random() * 10) + 1;
    
    // Mostrar la carta actual y las opciones
    renderLevel2();
}

function renderLevel2() {
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    cardsContainer.style.display = 'flex';
    
    // Contenedor principal del nivel 2
    const level2Layout = document.createElement('div');
    level2Layout.className = 'level2-layout';
    
    // Mostrar contador de rondas arriba
    const roundsDiv = document.createElement('div');
    roundsDiv.className = 'rounds-counter';
    roundsDiv.textContent = `Rondas restantes: ${roundsRemaining}`;
    level2Layout.appendChild(roundsDiv);
    
    // Fila de cartas (solo las dos cartas lado a lado)
    const cardsRow = document.createElement('div');
    cardsRow.className = 'cards-row';
    
    // Carta actual (izquierda) - usa card-front.png de fondo
    const currentCardDiv = document.createElement('div');
    currentCardDiv.className = 'current-card';
    currentCardDiv.style.position = 'relative';
    currentCardDiv.style.backgroundImage = 'url(assets/ui/level2/card-front.png)';
    currentCardDiv.style.backgroundSize = 'contain';
    currentCardDiv.style.backgroundRepeat = 'no-repeat';
    currentCardDiv.style.backgroundPosition = 'center';
    
    // Número de la carta encima de la imagen
    const currentCardNumber = document.createElement('div');
    currentCardNumber.textContent = currentCard;
    currentCardNumber.style.position = 'relative';
    currentCardNumber.style.zIndex = '2';
    currentCardDiv.appendChild(currentCardNumber);
    
    cardsRow.appendChild(currentCardDiv);
    
    // Tarjeta volteada (derecha) - próxima carta
    const cardFlipContainer = document.createElement('div');
    cardFlipContainer.className = 'card-flip-container';
    
    const cardFlipper = document.createElement('div');
    cardFlipper.className = 'card-flipper';
    cardFlipper.id = 'nextCardFlipper';
    
    // Cara frontal (reverso de la carta - card-back.png con ?)
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    cardFront.style.backgroundImage = 'url(assets/ui/level2/card-back.png)';
    cardFront.style.backgroundSize = 'contain';
    cardFront.style.backgroundRepeat = 'no-repeat';
    cardFront.style.backgroundPosition = 'center';
    
    // Cara trasera (card-front.png con el número)
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    cardBack.style.backgroundImage = 'url(assets/ui/level2/card-front.png)';
    cardBack.style.backgroundSize = 'contain';
    cardBack.style.backgroundRepeat = 'no-repeat';
    cardBack.style.backgroundPosition = 'center';
    
    const cardNumber = document.createElement('div');
    cardNumber.className = 'card-number';
    cardNumber.id = 'nextCardNumber';
    cardNumber.textContent = '?';
    cardNumber.style.position = 'relative';
    cardNumber.style.zIndex = '2';
    cardBack.appendChild(cardNumber);
    
    cardFlipper.appendChild(cardFront);
    cardFlipper.appendChild(cardBack);
    cardFlipContainer.appendChild(cardFlipper);
    cardsRow.appendChild(cardFlipContainer);
    
    level2Layout.appendChild(cardsRow);
    
    // Instrucción debajo de las cartas
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'instruction';
    instructionDiv.textContent = `¿La siguiente carta será?`;
    level2Layout.appendChild(instructionDiv);
    
    // Crear botones de predicción (abajo)
    const predictionsDiv = document.createElement('div');
    predictionsDiv.className = 'predictions';
    
    const lowerBtn = createPredictionButton('Menor', 'lower');
    const equalBtn = createPredictionButton('Igual', 'equal');
    const higherBtn = createPredictionButton('Mayor', 'higher');
    
    predictionsDiv.appendChild(lowerBtn);
    predictionsDiv.appendChild(equalBtn);
    predictionsDiv.appendChild(higherBtn);
    
    level2Layout.appendChild(predictionsDiv);
    cardsContainer.appendChild(level2Layout);
}

function createPredictionButton(text, prediction) {
    const btn = document.createElement('button');
    btn.className = 'prediction-btn';
    
    // Map predictions to image files
    const predictionImages = {
        'lower': 'assets/ui/level2/btn-less.png',
        'equal': 'assets/ui/level2/btn-equal.png',
        'higher': 'assets/ui/level2/btn-greater.png'
    };
    
    // Create image instead of text
    const img = document.createElement('img');
    img.src = predictionImages[prediction];
    img.alt = text;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    btn.appendChild(img);
    
    btn.addEventListener('click', () => handlePrediction(prediction));
    return btn;
}

function handlePrediction(prediction) {
    // Deshabilitar botones mientras se procesa
    const allBtns = document.querySelectorAll('.prediction-btn');
    allBtns.forEach(btn => btn.disabled = true);
    
    // Generar la nueva carta [1-10]
    const nextCard = Math.floor(Math.random() * 10) + 1;
    
    // Actualizar el número en la carta antes de voltear
    const nextCardNumber = document.getElementById('nextCardNumber');
    if (nextCardNumber) {
        nextCardNumber.textContent = nextCard;
    }
    
    // Animar el volteo de la carta
    const cardFlipper = document.getElementById('nextCardFlipper');
    if (cardFlipper) {
        cardFlipper.classList.add('flipped');
    }
    
    // Verificar predicción
    let correct = false;
    let pointsEarned = 0;
    
    if (prediction === 'higher' && nextCard > currentCard) {
        correct = true;
        pointsEarned = 1;
    } else if (prediction === 'lower' && nextCard < currentCard) {
        correct = true;
        pointsEarned = 1;
    } else if (prediction === 'equal' && nextCard === currentCard) {
        correct = true;
        pointsEarned = 3;
    }
    
    // Actualizar score si acertó
    if (correct) {
        score += pointsEarned;
        // Redondear tras sumar puntos
        score = Math.round(score * 100) / 100;
        updateScoreDisplay();
    }
    
    // Esperar a que termine la animación de volteo
    setTimeout(() => {
        // Mostrar resultado temporal
        showPredictionResult(nextCard, correct, pointsEarned);
        
        // Actualizar estado del juego
        currentCard = nextCard;
        roundsRemaining--;
        
        // Después de un delay, continuar o terminar
        setTimeout(() => {
            if (roundsRemaining > 0) {
                renderLevel2();
            } else {
                endGame();
            }
        }, 1500);
    }, 800);
}

function showPredictionResult(nextCard, correct, points) {
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'prediction-result';
    
    // Carta con el resultado usando card-front.png
    const cardDiv = document.createElement('div');
    cardDiv.className = 'result-card';
    cardDiv.style.backgroundImage = 'url(assets/ui/level2/card-front.png)';
    cardDiv.style.backgroundSize = 'contain';
    cardDiv.style.backgroundRepeat = 'no-repeat';
    cardDiv.style.backgroundPosition = 'center';
    cardDiv.style.position = 'relative';
    
    const cardNumber = document.createElement('div');
    cardNumber.textContent = nextCard;
    cardNumber.style.position = 'relative';
    cardNumber.style.zIndex = '2';
    cardNumber.style.font = '900 min(48px, 8vw) Montserrat';
    cardNumber.style.color = '#333';
    cardNumber.style.textShadow = '0 2px 4px rgba(255,255,255,0.8)';
    cardDiv.appendChild(cardNumber);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = correct ? 'result-message correct' : 'result-message incorrect';
    messageDiv.textContent = correct ? `¡Correcto! +${points} punto${points > 1 ? 's' : ''}` : '¡Incorrecto!';
    
    resultDiv.appendChild(cardDiv);
    resultDiv.appendChild(messageDiv);
    cardsContainer.appendChild(resultDiv);
}

function endGame() {
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    const endDiv = document.createElement('div');
    endDiv.className = 'game-end';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'end-title';
    titleDiv.textContent = '¡Nivel 2 Completado!';
    
    const finalScoreDiv = document.createElement('div');
    finalScoreDiv.className = 'final-score';
    finalScoreDiv.textContent = `Puntuación: ${formatScoreValue(score)}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.style.font = '600 16px Montserrat';
    messageDiv.style.color = '#666';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.marginTop = '10px';
    messageDiv.textContent = 'Preparándote para el nivel final...';
    
    endDiv.appendChild(titleDiv);
    endDiv.appendChild(finalScoreDiv);
    endDiv.appendChild(messageDiv);
    
    cardsContainer.appendChild(endDiv);
    
    // Ir automáticamente al nivel 3 después de 2 segundos
    setTimeout(() => {
        startLevel3();
    }, 2000);
}

// Initialize display
updateScoreDisplay();

// ========== LEVEL 3: Coin Flip Betting Game ==========

function startLevel3() {
    gameLevel = 3;
    level3Started = true;
    coinFlipsRemaining = 5;
    isFirstFlip = true;

    // Update visual background for level 3
    setGameScreenLevel(3);
    
    // Update header image for level 3
    const headerImg = document.querySelector('.header-image');
    if (headerImg) {
        headerImg.src = 'assets/ui/level3/header-level3.png';
        headerImg.alt = 'Nivel 3';
    }
    
    // Update level counter
    const levelValue = document.getElementById('level-value');
    if (levelValue) levelValue.textContent = '3';
    
    // Asegurar que el score mínimo sea 1 para poder apostar
    if (score < 1) {
        score = 1;
        updateScoreDisplay();
    }
    
    // Ocultar elementos de nivel 2
    if (resultEl) resultEl.style.display = 'none';
    
    // Mantener contenedor expandido para nivel 3
    const container = document.querySelector('.container');
    if (container) container.classList.add('wide');
    
    // Mostrar interfaz de nivel 3
    renderLevel3();
}

function renderLevel3() {
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    cardsContainer.style.display = 'flex';
    
    const level3Container = document.createElement('div');
    level3Container.className = 'level3-container';
    
    // Contenedor de moneda con imagen de fondo
    const coinContainerDiv = document.createElement('div');
    coinContainerDiv.className = 'coin-container-wrapper';
    coinContainerDiv.style.position = 'relative';
    coinContainerDiv.style.width = 'min(300px, 50vw)';
    coinContainerDiv.style.height = 'auto';
    coinContainerDiv.style.aspectRatio = '1';
    
    const coinContainerBg = document.createElement('img');
    coinContainerBg.src = 'assets/ui/level3/coin-container.png';
    coinContainerBg.style.width = '100%';
    coinContainerBg.style.height = '100%';
    coinContainerBg.style.objectFit = 'contain';
    
    // Moneda (inicialmente sin mostrar resultado)
    const coinDiv = document.createElement('div');
    coinDiv.className = 'coin-display';
    coinDiv.id = 'coin';
    coinDiv.textContent = '?';
    
    coinContainerDiv.appendChild(coinContainerBg);
    coinContainerDiv.appendChild(coinDiv);
    level3Container.appendChild(coinContainerDiv);
    
    // Panel de apuestas
    const betPanel = document.createElement('div');
    betPanel.className = 'bet-panel';
    
    // Info del banco y rondas
    const betInfo = document.createElement('div');
    betInfo.className = 'bet-info';
    
    const bankDisplay = document.createElement('div');
    bankDisplay.className = 'bank-display';
    bankDisplay.textContent = `Banco: ${formatScoreValue(score)} puntos`;
    
    const roundsInfo = document.createElement('div');
    roundsInfo.className = 'rounds-info';
    roundsInfo.textContent = `Lanzamientos restantes: ${coinFlipsRemaining}/5`;
    if (isFirstFlip) {
        roundsInfo.textContent += ' (Obligatorio)';
    }
    
    betInfo.appendChild(bankDisplay);
    betInfo.appendChild(roundsInfo);
    betPanel.appendChild(betInfo);
    
    // Input de apuesta
    const betInputGroup = document.createElement('div');
    betInputGroup.className = 'bet-input-group';
    
    const betLabel = document.createElement('div');
    betLabel.className = 'bet-label';
    betLabel.textContent = 'Cantidad a apostar (mín: 1)';
    
    const betInput = document.createElement('input');
    betInput.type = 'number';
    betInput.className = 'bet-input';
    betInput.id = 'betAmount';
    betInput.min = 1;
    betInput.max = score;
    betInput.value = Math.min(2, score);
    
    const betSlider = document.createElement('input');
    betSlider.type = 'range';
    betSlider.className = 'bet-slider';
    betSlider.id = 'betSlider';
    betSlider.min = 1;
    betSlider.max = score;
    betSlider.value = Math.min(2, score);
    
    // Sincronizar input y slider
    betInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value) || 1;
        if (val < 1) val = 1;
        if (val > score) val = score;
        betInput.value = val;
        betSlider.value = val;
        currentBet = val;
    });
    
    betSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        betInput.value = val;
        currentBet = val;
    });
    
    currentBet = Math.min(1, score);
    
    betInputGroup.appendChild(betLabel);
    betInputGroup.appendChild(betInput);
    betInputGroup.appendChild(betSlider);
    betPanel.appendChild(betInputGroup);
    
    // Elección: Cara o Sello
    const choiceLabel = document.createElement('div');
    choiceLabel.className = 'bet-label';
    choiceLabel.textContent = 'Elige tu predicción:';
    betPanel.appendChild(choiceLabel);
    
    const choiceButtons = document.createElement('div');
    choiceButtons.className = 'choice-buttons';
    
    const caraBtn = document.createElement('button');
    caraBtn.className = 'choice-btn';
    caraBtn.id = 'caraBtn';
    const caraImg = document.createElement('img');
    caraImg.src = 'assets/ui/level3/btn-coin-face.png';
    caraImg.alt = 'Cara';
    caraImg.style.width = '100%';
    caraImg.style.height = '100%';
    caraImg.style.objectFit = 'contain';
    caraBtn.appendChild(caraImg);
    
    const selloBtn = document.createElement('button');
    selloBtn.className = 'choice-btn';
    selloBtn.id = 'selloBtn';
    const selloImg = document.createElement('img');
    selloImg.src = 'assets/ui/level3/btn-coin-tails.png';
    selloImg.alt = 'Sello';
    selloImg.style.width = '100%';
    selloImg.style.height = '100%';
    selloImg.style.objectFit = 'contain';
    selloBtn.appendChild(selloImg);
    
    // Selección de cara/sello
    caraBtn.addEventListener('click', () => {
        selectedCoin = 'cara';
        caraBtn.classList.add('selected');
        selloBtn.classList.remove('selected');
    });
    
    selloBtn.addEventListener('click', () => {
        selectedCoin = 'sello';
        selloBtn.classList.add('selected');
        caraBtn.classList.remove('selected');
    });
    
    choiceButtons.appendChild(caraBtn);
    choiceButtons.appendChild(selloBtn);
    betPanel.appendChild(choiceButtons);
    
    // Botones de acción
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    
    const flipBtn = document.createElement('button');
    flipBtn.className = 'action-btn flip-btn';
    const flipBtnImg = document.createElement('img');
    flipBtnImg.src = isFirstFlip ? 'assets/ui/common/btn-lanzar.png' : 'assets/ui/common/btn-apostar.png';
    flipBtnImg.alt = isFirstFlip ? 'Lanzar' : 'Apostar';
    flipBtnImg.style.width = '100%';
    flipBtnImg.style.height = '100%';
    flipBtnImg.style.objectFit = 'contain';
    flipBtn.appendChild(flipBtnImg);
    
    flipBtn.addEventListener('click', () => {
        if (!selectedCoin) {
            alert('Debes elegir CARA o SELLO');
            return;
        }
        if (currentBet < 1) {
            alert('La apuesta mínima es 1 punto');
            return;
        }
        if (currentBet > score) {
            alert('No tienes suficientes puntos');
            return;
        }
        executeCoinFlip();
    });
    
    actionButtons.appendChild(flipBtn);
    
    // Botón "Plantarse" (solo después de la primera tirada)
    if (!isFirstFlip) {
        const standBtn = document.createElement('button');
        standBtn.className = 'action-btn secondary stand-btn';
        const standBtnImg = document.createElement('img');
        standBtnImg.src = 'assets/ui/common/btn-plantarse.png';
        standBtnImg.alt = 'Plantarse';
        standBtnImg.style.width = '100%';
        standBtnImg.style.height = '100%';
        standBtnImg.style.objectFit = 'contain';
        standBtn.appendChild(standBtnImg);
        standBtn.addEventListener('click', () => {
            endLevel3();
        });
        actionButtons.appendChild(standBtn);
    }
    
    betPanel.appendChild(actionButtons);
    level3Container.appendChild(betPanel);
    
    cardsContainer.appendChild(level3Container);
}

function executeCoinFlip() {
    // Deshabilitar interacción
    const allBtns = document.querySelectorAll('.choice-btn, .action-btn');
    allBtns.forEach(btn => btn.disabled = true);
    
    const coin = document.getElementById('coin');
    
    // Animación de lanzamiento
    coin.classList.add('flipping');
    coin.textContent = '...';
    
    setTimeout(() => {
        // Generar resultado aleatorio
        const result = Math.random() < 0.5 ? 'cara' : 'sello';
        
        // Verificar si ganó
        const won = (result === selectedCoin);
        
        // Actualizar moneda visual
        coin.classList.remove('flipping');
        coin.classList.add(result);
        coin.textContent = result === 'cara' ? 'CARA' : 'SELLO';
        
        // Calcular ganancia/pérdida
        let payout = 0;
        if (won) {
            payout = currentBet * 2; // Gana el doble
            score = score - currentBet + payout; // Resta apuesta, suma ganancia
        } else {
            score = score - currentBet; // Pierde la apuesta
        }
        
        // Evitar score negativo
        if (score < 0) score = 0;
        // Redondear el score y actualizar la UI
        score = Math.round(score * 100) / 100;
        updateScoreDisplay();
        
        // Actualizar estado
        coinFlipsRemaining--;
        isFirstFlip = false;
        
        // Mostrar resultado
        setTimeout(() => {
            showCoinFlipResult(won, payout, result);
        }, 800);
        
    }, 1000);
}

function showCoinFlipResult(won, payout, result) {
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'flip-result';
    
    // Moneda con resultado
    const coinDiv = document.createElement('div');
    coinDiv.className = `coin-display ${result}`;
    coinDiv.textContent = result === 'cara' ? 'CARA' : 'SELLO';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = won ? 'flip-message win' : 'flip-message lose';
    
    if (won) {
        messageDiv.textContent = `¡Ganaste! +${formatScoreValue(payout - currentBet)} puntos`;
    } else {
        messageDiv.textContent = `Perdiste -${formatScoreValue(currentBet)} puntos`;
    }
    
    const bankDiv = document.createElement('div');
    bankDiv.className = 'bank-display';
    bankDiv.textContent = `Banco actual: ${formatScoreValue(score)} puntos`;
    
    resultDiv.appendChild(coinDiv);
    resultDiv.appendChild(messageDiv);
    resultDiv.appendChild(bankDiv);
    
    // Botón para continuar
    const continueBtn = document.createElement('button');
    continueBtn.className = 'continue-btn';
    
    // Decidir qué mostrar según el estado
    if (score < 1) {
        // No puede seguir apostando
        continueBtn.textContent = 'Finalizar Juego';
        continueBtn.addEventListener('click', () => endLevel3());
    } else if (coinFlipsRemaining <= 0) {
        // Sin rondas restantes
        continueBtn.textContent = 'Finalizar Nivel 3';
        continueBtn.addEventListener('click', () => endLevel3());
    } else {
        // Puede continuar
        continueBtn.textContent = 'Continuar';
        continueBtn.addEventListener('click', () => {
            // Reset selección
            selectedCoin = null;
            renderLevel3();
        });
    }
    
    resultDiv.appendChild(continueBtn);
    cardsContainer.appendChild(resultDiv);
}

function endLevel3() {
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    const endDiv = document.createElement('div');
    endDiv.className = 'game-end';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'end-title';
    titleDiv.textContent = '¡Juego Completado!';
    
    const finalScoreDiv = document.createElement('div');
    finalScoreDiv.className = 'final-score';
    finalScoreDiv.textContent = `Puntuación Final: ${formatScoreValue(score)} puntos`;
    
    const messageDiv = document.createElement('div');
    messageDiv.style.font = '600 16px Montserrat';
    messageDiv.style.color = '#666';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.marginTop = '10px';
    
    if (score >= 50) {
        messageDiv.textContent = 'Eres un maestro del azar';
    } else if (score >= 20) {
        messageDiv.textContent = '¡Bien hecho! Gran puntuación';
    } else if (score >= 10) {
        messageDiv.textContent = 'Buen intento, sigue practicando';
    } else {
        messageDiv.textContent = 'La suerte no estuvo de tu lado hoy';
    }
    
    const restartBtn = document.createElement('button');
    restartBtn.className = 'restart-btn';
    restartBtn.textContent = 'Jugar de Nuevo';
    restartBtn.addEventListener('click', () => location.reload());
    
    endDiv.appendChild(titleDiv);
    endDiv.appendChild(finalScoreDiv);
    endDiv.appendChild(messageDiv);
    endDiv.appendChild(restartBtn);
    
    cardsContainer.appendChild(endDiv);
}
