// ========== SISTEMA DE SONIDOS ==========
const SoundManager = {
    sounds: {},
    currentLoopingSounds: {},
    currentBackgroundSound: null,
    activeSounds: [],
    musicMuted: false,
    lastBackgroundLevel: 1,
    
    // Función para cargar un sonido con detección automática de formato
    loadSound(name, basePath) {
        if (this.sounds[name]) return this.sounds[name];
        
        // Determinar formato prioritario según el tipo de sonido
        // Los sonidos de fondo son .mp3, los demás principalmente .wav
        const isBackground = name.includes('Bg');
        const formats = isBackground ? ['mp3', 'wav', 'ogg'] : ['wav', 'mp3', 'ogg'];
        
        const audio = new Audio();
        
        // Intentar con el primer formato
        audio.src = `${basePath}.${formats[0]}`;
        audio.preload = 'auto';
        audio.volume = 0.7;
        
        let currentFormat = 0;
        
        const tryNextFormat = () => {
            currentFormat++;
            if (currentFormat < formats.length) {
                audio.src = `${basePath}.${formats[currentFormat]}`;
                audio.load();
            } else {
                console.warn(`No se pudo cargar el sonido: ${basePath}`);
            }
        };
        
        audio.addEventListener('error', tryNextFormat, { once: false });
        
        // Guardar referencia cuando se carga exitosamente
        audio.addEventListener('canplaythrough', () => {
            audio.removeEventListener('error', tryNextFormat);
        }, { once: true });
        
        audio.load();
        this.sounds[name] = audio;
        
        // Debug: verificar carga
        audio.addEventListener('loadeddata', () => {
            console.log(`✓ Sonido cargado: ${name} desde ${audio.src}`);
        }, { once: true });
        
        return audio;
    },
    
    // Reproducir un sonido
    play(name, options = {}) {
        if (this.musicMuted) {
            return null;
        }
        
        // Si es un sonido de fondo, no pausar otros sonidos
        const isBackgroundSound = name.includes('Bg');
        
        if (!this.sounds[name]) {
            console.warn(`Sonido ${name} no encontrado. Intentando cargar...`);
            // Intentar cargar de nuevo si no está disponible
            return null;
        }
        
        // Obtener la ruta del sonido original
        let originalSrc = this.sounds[name].src;
        
        // Si no tiene src, intentar construir la ruta
        if (!originalSrc || originalSrc === window.location.href) {
            // Construir la ruta basada en el nombre
            const pathMap = {
                'btnGirarClick': 'assets/sounds/level1/btn-girar-click.wav',
                'diceRolling': 'assets/sounds/level1/dice-rolling.mp3',
                'btnOperacionClick': 'assets/sounds/level1/btn-operacion-click.wav',
                'resultadoPositivo': 'assets/sounds/level1/resultado-positivo.wav',
                'resultadoNegativo': 'assets/sounds/level1/resultado-negativo.wav',
                'btnDecisionClick': 'assets/sounds/level2/btn-decision-click.wav',
                'aciertoVictoria': 'assets/sounds/level2/acierto-victoria.wav',
                'errorFallo': 'assets/sounds/level2/error-fallo.wav',
                'btnCaraSelloClick': 'assets/sounds/level3/btn-cara-sello-click.wav',
                'apuestaTick': 'assets/sounds/level3/apuesta-tick.wav',
                'btnLanzar': 'assets/sounds/level3/btn-lanzar.wav',
                'coinSpinning': 'assets/sounds/level3/coin-spinning.wav',
                'aciertoJingle': 'assets/sounds/level3/acierto-jingle.wav',
                'falloGrave': 'assets/sounds/level3/fallo-grave.wav',
                'level1Bg': 'assets/sounds/level1/background.mp3',
                'level2Bg': 'assets/sounds/level2/background.mp3',
                'level3Bg': 'assets/sounds/level3/background.mp3'
            };
            
            if (pathMap[name]) {
                originalSrc = pathMap[name];
            } else {
                console.warn(`No se encontró ruta para el sonido ${name}`);
                return null;
            }
        }
        
        // Crear una nueva instancia de audio
        const audio = new Audio(originalSrc);
        audio.volume = options.volume !== undefined ? options.volume : 0.7;
        
        if (options.loop) {
            audio.loop = true;
            this.currentLoopingSounds[name] = audio;
        }
        
        // Si NO es sonido de fondo, pausar música de fondo y registrar como activo
        if (!isBackgroundSound) {
            this.pauseBackgroundMusic();
            this.registerActiveSound(audio);
            
            // Para sonidos en loop, no esperar a que terminen (no tienen 'ended')
            // Se manejarán cuando se llame a stop()
        }
        
        // Intentar reproducir
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                // Silenciar errores de autoplay (el usuario necesita interactuar primero)
                if (err.name !== 'NotAllowedError') {
                    console.log(`No se pudo reproducir el sonido ${name}:`, err, `src: ${originalSrc}`);
                }
            });
        }
        
        return audio;
    },
    
    // Detener un sonido que está en loop
    stop(name) {
        if (this.currentLoopingSounds[name]) {
            const audio = this.currentLoopingSounds[name];
            audio.pause();
            audio.currentTime = 0;
            delete this.currentLoopingSounds[name];
            
            // Remover de sonidos activos si está ahí
            this.activeSounds = this.activeSounds.filter(s => s !== audio);
            
            // Si no hay más sonidos activos, reanudar música de fondo
            if (this.activeSounds.length === 0) {
                this.resumeBackgroundMusic();
            }
        }
    },
    
    // Detener todos los sonidos en loop
    stopAll() {
        Object.keys(this.currentLoopingSounds).forEach(name => {
            this.stop(name);
        });
    },
    
    // Reproducir sonido de fondo de un nivel
    playBackgroundMusic(level) {
        this.lastBackgroundLevel = level;
        
        // Detener el sonido de fondo anterior si existe
        if (this.currentBackgroundSound) {
            this.stopBackgroundMusic();
        }
        
        // Si la música está silenciada, no reproducir
        if (this.musicMuted) {
            return;
        }
        
        const soundName = `level${level}Bg`;
        const audio = this.play(soundName, { 
            loop: true, 
            volume: 0.6 // 60% de volumen
        });
        
        if (audio) {
            this.currentBackgroundSound = audio;
        }
    },
    
    // Pausar música de fondo (cuando hay otros sonidos)
    pauseBackgroundMusic() {
        if (this.currentBackgroundSound && !this.currentBackgroundSound.paused) {
            this.currentBackgroundSound.pause();
        }
    },
    
    // Reanudar música de fondo (cuando no hay otros sonidos)
    resumeBackgroundMusic() {
        if (this.currentBackgroundSound && this.currentBackgroundSound.paused) {
            this.currentBackgroundSound.play().catch(err => {
                // Ignorar errores de autoplay
            });
        }
    },
    
    // Detener música de fondo
    stopBackgroundMusic() {
        if (this.currentBackgroundSound) {
            this.currentBackgroundSound.pause();
            this.currentBackgroundSound.currentTime = 0;
            this.currentBackgroundSound = null;
        }
    },
    
    setMusicMuted(muted) {
        this.musicMuted = muted;
        if (muted) {
            this.stopBackgroundMusic();
            this.stopAll();
            this.activeSounds.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
            this.activeSounds = [];
        } else if (this.lastBackgroundLevel) {
            this.playBackgroundMusic(this.lastBackgroundLevel);
        }
    },
    
    // Registrar un sonido activo (no de fondo)
    registerActiveSound(audio) {
        if (audio && !this.activeSounds.includes(audio)) {
            this.activeSounds.push(audio);
            // Pausar música de fondo mientras hay sonidos activos
            this.pauseBackgroundMusic();
            
            // Cuando termine el sonido, removerlo de la lista
            audio.addEventListener('ended', () => {
                this.activeSounds = this.activeSounds.filter(s => s !== audio);
                // Si no hay más sonidos activos, reanudar música de fondo
                if (this.activeSounds.length === 0) {
                    this.resumeBackgroundMusic();
                }
            }, { once: true });
        }
    }
};

// Cargar todos los sonidos del juego con sus formatos específicos
// Basado en los archivos reales que tienes
SoundManager.loadSound('btnGirarClick', 'assets/sounds/level1/btn-girar-click');
SoundManager.loadSound('diceRolling', 'assets/sounds/level1/dice-rolling'); // .mp3
SoundManager.loadSound('btnOperacionClick', 'assets/sounds/level1/btn-operacion-click');
SoundManager.loadSound('resultadoPositivo', 'assets/sounds/level1/resultado-positivo');
SoundManager.loadSound('resultadoNegativo', 'assets/sounds/level1/resultado-negativo');

SoundManager.loadSound('btnDecisionClick', 'assets/sounds/level2/btn-decision-click');
SoundManager.loadSound('aciertoVictoria', 'assets/sounds/level2/acierto-victoria');
SoundManager.loadSound('errorFallo', 'assets/sounds/level2/error-fallo');

SoundManager.loadSound('btnCaraSelloClick', 'assets/sounds/level3/btn-cara-sello-click');
SoundManager.loadSound('apuestaTick', 'assets/sounds/level3/apuesta-tick');
SoundManager.loadSound('btnLanzar', 'assets/sounds/level3/btn-lanzar');
SoundManager.loadSound('coinSpinning', 'assets/sounds/level3/coin-spinning');
SoundManager.loadSound('aciertoJingle', 'assets/sounds/level3/acierto-jingle');
SoundManager.loadSound('falloGrave', 'assets/sounds/level3/fallo-grave');

// Cargar sonidos de fondo para cada nivel (solo uno por nivel)
SoundManager.loadSound('level1Bg', 'assets/sounds/level1/background');
SoundManager.loadSound('level2Bg', 'assets/sounds/level2/background');
SoundManager.loadSound('level3Bg', 'assets/sounds/level3/background');

const dice = document.querySelector('.dice');
const rollBtn = document.querySelector('.action-button');
const resultEl = document.getElementById('result');
const scoreEl = document.getElementById('score-value');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const soundToggleIcon = document.getElementById('sound-toggle-icon');
const cardsContainer = document.getElementById('cards');
const operationsDisplay = document.getElementById('operations-display');

function updateSoundToggleUI() {
    if (!soundToggleBtn || !soundToggleIcon) return;
    const muted = SoundManager.musicMuted;
    soundToggleIcon.textContent = muted ? '🔇' : '🔊';
    soundToggleBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
}

if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
        SoundManager.setMusicMuted(!SoundManager.musicMuted);
        updateSoundToggleUI();
    });
    
    updateSoundToggleUI();
}

const randomDice = () => {
    // Genera un número entero entre 1 y 6 (inclusive)
    return Math.floor(Math.random() * 6) + 1;
}

const rollDice = random => {
    // Desactivar botón mientras el dado "rueda"
    rollBtn.disabled = true;
    rollBtn.style.opacity = '0.6';

    // Ocultar tarjetas mientras el dado gira
    if (cardsContainer) cardsContainer.style.display = 'none';
    
    // Mostrar mensaje de "Girando..."
    if (operationsDisplay) {
        operationsDisplay.textContent = 'Girando...';
    }

    // 🔹 Duración variable: si sale 1, el dado para más rápido
    const duration = random === 1 ? 1 : 2; // segundos
    dice.style.animation = `rolling ${duration}s ease-out`;
    
    // Reproducir sonido de dado rodando
    SoundManager.play('diceRolling', { loop: true });

    // Esperar a que termine la animación antes de mostrar el resultado
    setTimeout(() => {
        // Detener sonido de dado rodando
        SoundManager.stop('diceRolling');
        dice.style.animation = 'none';
        
        // 🔹 Aplicar la rotación final según el número obtenido
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

        // Mostrar número en pantalla
        if (resultEl) {
            resultEl.textContent = random;
        }

        // --- Lógica del puntaje y operaciones ---
        if (pendingOp !== null) {
            const previousScore = score;
            applyOperation(pendingOp, random);
            
            // Reproducir sonido de resultado (positivo o negativo)
            const scoreIncreased = score > previousScore;
            if (scoreIncreased) {
                SoundManager.play('resultadoPositivo');
            } else if (score < previousScore) {
                SoundManager.play('resultadoNegativo');
            } else {
                // Si el score no cambió (división por 1, etc.), usar positivo
                SoundManager.play('resultadoPositivo');
            }
            
            if (operationsDisplay) {
                operationsDisplay.textContent = `${formatScoreValue(previousScore)} ${pendingOp} ${random} = ${formatScoreValue(score)}`;
            }

            pendingOp = null;

            if (availableOps.length > 0) {
                if (cardsContainer) {
                    cardsContainer.style.display = 'flex';
                    cardsContainer.style.flexDirection = 'row'; // Asegurar que estén en un renglón
                }
                renderCards(random);
                rollBtn.disabled = true;
                rollBtn.style.opacity = '0.6';
            } else {
                setTimeout(() => {
                    // Mostrar intro del nivel 2 antes de iniciarlo
                    showIntroScreen(2);
                }, 1000);
            }

        } else {
            // Si es la primera tirada
            if (score === null) {
                score = random;
                updateScoreDisplay();

                if (operationsDisplay) {
                    operationsDisplay.textContent = `Valor inicial: ${random}`;
                }
            }

            // Mostrar tarjetas para elegir la operación siguiente
            if (availableOps.length > 0) {
                if (cardsContainer) {
                    cardsContainer.style.display = 'flex';
                    cardsContainer.style.flexDirection = 'row'; // Asegurar que estén en un renglón
                }
                renderCards(random);
                rollBtn.disabled = true;
                rollBtn.style.opacity = '0.6';
            }
        }

        // No reactivar botón automáticamente — se activa al seleccionar operación o pasar de nivel
    }, (duration * 1000) + 50); // 🔹 Ajuste dinámico del tiempo de espera
};

rollBtn.addEventListener('click', () => {
    SoundManager.play('btnGirarClick');
    const n = randomDice();
    rollDice(n);
});

// --- Game state for score and available operations ---
// `score` is null until the first roll — this avoids multiplying by 0
let score = null;
// availableOps will hold the operations currently available as strings
let availableOps = ['+', '-', '\u00D7', '\u00F7']; // × y ÷ en Unicode
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
    if (!cardsContainer) return;
    // Clear existing cards
    cardsContainer.innerHTML = '';

    // Allow one selection per roll
    let selectionMade = false;

    // Map operations to image files
    const opImages = {
        '+': 'assets/ui/level1/btn-plus.png',
        '-': 'assets/ui/level1/btn-minus.png',
        '\u00D7': 'assets/ui/level1/btn-times.png', // ×
        '\u00F7': 'assets/ui/level1/btn-divide.png' // ÷
    };

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

        btn.addEventListener('click', () => {
            // Prevent multiple selections in the same roll
            if (selectionMade) return;
            // If the op was already removed, ignore
            if (!availableOps.includes(op)) return;

            // Reproducir sonido de click en operación
            SoundManager.play('btnOperacionClick');
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
        case '\u00D7': // ×
            score = score * v;
            break;
        case '\u00F7': // ÷
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
    // Eliminar botón Next si existe
    const existingNextBtn = document.querySelector('.intro-next-btn');
    if (existingNextBtn) existingNextBtn.remove();
    
    // Restaurar fondo del nivel 2
    const gameScreen = document.querySelector('.game-screen');
    if (gameScreen) {
        gameScreen.style.backgroundImage = '';
        gameScreen.style.backgroundColor = '';
        setGameScreenLevel(2);
    }
    
    // Mostrar contadores
    const countersBar = document.querySelector('.counters-bar');
    if (countersBar) countersBar.style.display = 'flex';
    
    // Mostrar header del nivel
    const levelHeader = document.querySelector('.level-header');
    if (levelHeader) levelHeader.style.display = 'flex';
    
    gameLevel = 2;
    level2Started = true;
    roundsRemaining = 10;
    
    // Reproducir música de fondo del nivel 2
    SoundManager.playBackgroundMusic(2);
    
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
    
    // Ocultar el display de operaciones
    if (operationsDisplay) operationsDisplay.style.display = 'none';
    
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
    
    btn.addEventListener('click', () => {
        SoundManager.play('btnDecisionClick');
        handlePrediction(prediction);
    });
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
    
    // Actualizar score
    if (correct) {
        score += pointsEarned;
        // Reproducir sonido de acierto
        SoundManager.play('aciertoVictoria');
    } else {
        // Restar 1 punto si es incorrecto
        score -= 1;
        pointsEarned = -1; // Para mostrar la imagen incorrect-1.png
        // Reproducir sonido de error
        SoundManager.play('errorFallo');
    }
    
    // Evitar score negativo
    if (score < 0) score = 0;
    
    // Redondear tras sumar/restar puntos
    score = Math.round(score * 100) / 100;
    updateScoreDisplay();
    
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
    cardNumber.style.font = '900 min(80px, 14vw) Montserrat';
    cardNumber.style.color = '#333';
    cardNumber.style.textShadow = '0 2px 4px rgba(255,255,255,0.8)';
    cardDiv.appendChild(cardNumber);
    
    const messageDiv = document.createElement('div');
    // Determinar qué clase usar según el resultado
    let resultClass = 'result-message';
    if (correct) {
        resultClass = 'result-message correct';
    } else {
        resultClass = 'result-message incorrect';
    }
    messageDiv.className = resultClass;
    messageDiv.style.position = 'relative';
    
    const messageImg = document.createElement('img');
    // Usar las imágenes correct.png o incorrect.png
    if (correct) {
        messageImg.src = 'assets/ui/common/correct.png';
        messageImg.alt = '¡Correcto!';
    } else {
        messageImg.src = 'assets/ui/common/incorrect.png';
        messageImg.alt = '¡Incorrecto!';
    }
    messageImg.style.width = '100%';
    messageImg.style.height = '100%';
    messageImg.style.objectFit = 'contain';
    messageDiv.appendChild(messageImg);
    
    // Crear animación numérica
    const pointsText = document.createElement('div');
    pointsText.className = 'points-animation';
    // Mostrar el signo y número
    if (correct) {
        pointsText.textContent = `+${points}`;
        pointsText.classList.add('points-positive');
    } else {
        pointsText.textContent = `-1`;
        pointsText.classList.add('points-negative');
    }
    messageDiv.appendChild(pointsText);
    
    // Iniciar animación después de un pequeño delay
    setTimeout(() => {
        pointsText.classList.add('animate');
    }, 100);
    
    // Eliminar el elemento después de la animación
    setTimeout(() => {
        if (pointsText.parentNode) {
            pointsText.parentNode.removeChild(pointsText);
        }
    }, 2000);
    
    resultDiv.appendChild(cardDiv);
    resultDiv.appendChild(messageDiv);
    cardsContainer.appendChild(resultDiv);
}

function endGame() {
    if (!cardsContainer) return;
    
    // Mostrar intro del nivel 3 antes de iniciarlo
    showIntroScreen(3);
}

// ========== SISTEMA DE PANTALLAS DE INTRODUCCIÓN ==========

// Iniciar nivel 1
function startLevel1() {
    // Eliminar botón Next si existe
    const existingNextBtn = document.querySelector('.intro-next-btn');
    if (existingNextBtn) existingNextBtn.remove();
    
    // Restaurar fondo del nivel 1
    const gameScreen = document.querySelector('.game-screen');
    if (gameScreen) {
        gameScreen.style.backgroundImage = '';
        gameScreen.style.backgroundColor = '';
        setGameScreenLevel(1);
    }
    
    // Mostrar contadores
    const countersBar = document.querySelector('.counters-bar');
    if (countersBar) countersBar.style.display = 'flex';
    
    // Mostrar header del nivel
    const levelHeader = document.querySelector('.level-header');
    if (levelHeader) levelHeader.style.display = 'flex';
    
    // Mostrar elementos del nivel 1
    const diceContainer = document.querySelector('.dice-container');
    if (diceContainer) diceContainer.style.display = 'flex';
    
    if (operationsDisplay) operationsDisplay.style.display = 'flex';
    
    if (rollBtn) rollBtn.style.display = 'block';
    
    if (resultEl) {
        resultEl.style.display = 'none';
    }
    
    // Limpiar contenedor de cards y restaurar estilo original
    if (cardsContainer) {
        cardsContainer.innerHTML = '';
        cardsContainer.style.display = 'none';
        // Restaurar flexDirection a row para que las operaciones se muestren en un renglón
        cardsContainer.style.flexDirection = 'row';
        cardsContainer.style.alignItems = 'center';
        cardsContainer.style.justifyContent = 'center';
    }
    
    gameLevel = 1;
    
    // Reproducir música de fondo del nivel 1
    SoundManager.playBackgroundMusic(1);
}

// Mostrar pantalla de introducción
function showIntroScreen(introIndex) {
    if (!cardsContainer) return;
    
    // Eliminar botón Next anterior si existe
    const existingNextBtn = document.querySelector('.intro-next-btn');
    if (existingNextBtn) existingNextBtn.remove();
    
    // Ocultar contadores mientras se muestra la intro
    const countersBar = document.querySelector('.counters-bar');
    if (countersBar) countersBar.style.display = 'none';
    
    // Ocultar header del nivel
    const levelHeader = document.querySelector('.level-header');
    if (levelHeader) levelHeader.style.display = 'none';
    
    // Ocultar elementos del juego
    const diceContainer = document.querySelector('.dice-container');
    if (diceContainer) diceContainer.style.display = 'none';
    
    if (operationsDisplay) operationsDisplay.style.display = 'none';
    
    if (rollBtn) rollBtn.style.display = 'none';
    
    if (resultEl) resultEl.style.display = 'none';
    
    // Cambiar fondo del juego para intro1, intro2, intro3
    const gameScreen = document.querySelector('.game-screen');
    if (gameScreen) {
        if (introIndex === 0) {
            // Intro general: mantener fondo actual
        } else if (introIndex === 1) {
            gameScreen.style.backgroundImage = 'url(assets/ui/level1/intro1.png)';
            gameScreen.style.backgroundSize = 'cover';
            gameScreen.style.backgroundPosition = 'center';
        } else if (introIndex === 2) {
            gameScreen.style.backgroundImage = 'url(assets/ui/level2/intro2.png)';
            gameScreen.style.backgroundSize = 'cover';
            gameScreen.style.backgroundPosition = 'center';
        } else if (introIndex === 3) {
            gameScreen.style.backgroundImage = 'url(assets/ui/level3/intro3.png)';
            gameScreen.style.backgroundSize = 'cover';
            gameScreen.style.backgroundPosition = 'center';
        }
    }
    
    // Limpiar contenedor
    cardsContainer.innerHTML = '';
    cardsContainer.style.display = 'flex';
    cardsContainer.style.flexDirection = 'column';
    cardsContainer.style.alignItems = 'center';
    cardsContainer.style.justifyContent = 'center';
    cardsContainer.style.width = '100%';
    cardsContainer.style.height = '100%';
    cardsContainer.style.position = 'relative';
    
    // Contenedor principal de la intro (solo para intro general)
    if (introIndex === 0) {
        const introContainer = document.createElement('div');
        introContainer.className = 'intro-container';
        introContainer.style.position = 'relative';
        introContainer.style.width = '100%';
        introContainer.style.height = '100%';
        introContainer.style.display = 'flex';
        introContainer.style.alignItems = 'center';
        introContainer.style.justifyContent = 'center';
        
        // Imagen de introducción general
        const introImg = document.createElement('img');
        introImg.src = 'assets/ui/common/intro.png';
        introImg.alt = 'Introducción General';
        introImg.style.maxWidth = '100%';
        introImg.style.maxHeight = '100%';
        introImg.style.objectFit = 'contain';
        introContainer.appendChild(introImg);
        
        // Botón Play (SOLO en la intro general - introIndex === 0)
        const playBtn = document.createElement('button');
        playBtn.className = 'intro-play-btn';
        playBtn.style.position = 'absolute';
        playBtn.style.top = '80%'; // Ajuste para evitar que se corte
        playBtn.style.left = '50%';
        playBtn.style.transform = 'translateX(-50%)';
        playBtn.style.background = 'none';
        playBtn.style.border = 'none';
        playBtn.style.borderRadius = '15px';
        playBtn.style.padding = '0';
        playBtn.style.cursor = 'pointer';
        playBtn.style.opacity = '0.9';
        playBtn.style.transition = 'opacity 0.2s, transform 0.2s';
        playBtn.style.zIndex = '10';
        playBtn.style.overflow = 'visible';
        
        playBtn.addEventListener('mouseenter', () => {
            playBtn.style.opacity = '1';
            playBtn.style.transform = 'translateX(-50%) scale(1.05)';
        });
        playBtn.addEventListener('mouseleave', () => {
            playBtn.style.opacity = '0.9';
            playBtn.style.transform = 'translateX(-50%) scale(1)';
        });
        
        const playImg = document.createElement('img');
        playImg.src = 'assets/ui/common/play.png';
        playImg.alt = 'Jugar';
        playImg.style.display = 'block';
        playImg.style.width = '100%';
        playImg.style.height = 'auto';
        playImg.style.maxWidth = '220px';
        playImg.style.maxHeight = '90px';
        playImg.style.objectFit = 'contain';
        playImg.style.borderRadius = '15px';
        playBtn.appendChild(playImg);
        
        playBtn.addEventListener('click', () => {
            SoundManager.play('btnOperacionClick');
            // Mostrar intro del nivel 1 antes de iniciarlo
            showIntroScreen(1);
        });
        
        introContainer.appendChild(playBtn);
        cardsContainer.appendChild(introContainer);
    }
    
    // Botón Next (SOLO en intro1, intro2, intro3)
    if (introIndex > 0) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'intro-next-btn';
        nextBtn.style.position = 'fixed';
        nextBtn.style.bottom = '20px';
        nextBtn.style.right = '20px';
        nextBtn.style.background = 'rgba(0, 0, 0, 0.3)';
        nextBtn.style.border = 'none';
        nextBtn.style.borderRadius = '50%';
        nextBtn.style.padding = '10px';
        nextBtn.style.cursor = 'pointer';
        nextBtn.style.opacity = '0.7';
        nextBtn.style.transition = 'all 0.2s';
        nextBtn.style.width = '50px';
        nextBtn.style.height = '50px';
        nextBtn.style.display = 'flex';
        nextBtn.style.alignItems = 'center';
        nextBtn.style.justifyContent = 'center';
        nextBtn.style.zIndex = '9999';
        
        nextBtn.addEventListener('mouseenter', () => {
            nextBtn.style.opacity = '1';
            nextBtn.style.background = 'rgba(0, 0, 0, 0.5)';
        });
        nextBtn.addEventListener('mouseleave', () => {
            nextBtn.style.opacity = '0.7';
            nextBtn.style.background = 'rgba(0, 0, 0, 0.3)';
        });
        
        const nextImg = document.createElement('img');
        nextImg.src = 'assets/ui/common/next.png';
        nextImg.alt = 'Siguiente';
        nextImg.style.width = '30px';
        nextImg.style.height = '30px';
        nextImg.style.objectFit = 'contain';
        nextBtn.appendChild(nextImg);
        
        nextBtn.addEventListener('click', () => {
            SoundManager.play('btnOperacionClick');
            if (introIndex === 1) {
                startLevel1();
            } else if (introIndex === 2) {
                startLevel2();
            } else if (introIndex === 3) {
                startLevel3();
            }
        });
        
        document.body.appendChild(nextBtn);
    }
}

// Initialize display
updateScoreDisplay();

// Mostrar pantalla de introducción general al cargar
showIntroScreen(0);

// ========== LEVEL 3: Coin Flip Betting Game ==========

function startLevel3() {
    // Eliminar botón Next si existe
    const existingNextBtn = document.querySelector('.intro-next-btn');
    if (existingNextBtn) existingNextBtn.remove();
    
    // Restaurar fondo del nivel 3
    const gameScreen = document.querySelector('.game-screen');
    if (gameScreen) {
        gameScreen.style.backgroundImage = '';
        gameScreen.style.backgroundColor = '';
        setGameScreenLevel(3);
    }
    
    // Mostrar contadores
    const countersBar = document.querySelector('.counters-bar');
    if (countersBar) countersBar.style.display = 'flex';
    
    // Mostrar header del nivel
    const levelHeader = document.querySelector('.level-header');
    if (levelHeader) levelHeader.style.display = 'flex';
    
    gameLevel = 3;
    level3Started = true;
    coinFlipsRemaining = 5;
    isFirstFlip = true;
    
    // Reproducir música de fondo del nivel 3
    SoundManager.playBackgroundMusic(3);
    
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
    
    // Actualizar el contador de coins con el score actual
    const coinsValue = document.getElementById('coins-value');
    if (coinsValue) coinsValue.textContent = formatScoreValue(score);
    
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
    
    // Indicador de lanzamientos restantes debajo del header
    const flipsRemainingDiv = document.createElement('div');
    flipsRemainingDiv.className = 'flips-remaining-indicator';
    flipsRemainingDiv.textContent = `Lanzamientos: ${coinFlipsRemaining}/5`;
    if (isFirstFlip) {
        flipsRemainingDiv.textContent += ' ';
    }
    level3Container.appendChild(flipsRemainingDiv);
    
    // Contenedor de moneda con imagen de fondo (más compacto)
    const coinContainerDiv = document.createElement('div');
    coinContainerDiv.className = 'coin-container-wrapper';
    coinContainerDiv.style.position = 'relative';
    coinContainerDiv.style.width = 'min(160px, 35vw)';
    coinContainerDiv.style.height = 'min(160px, 35vw)';
    coinContainerDiv.style.display = 'flex';
    coinContainerDiv.style.alignItems = 'center';
    coinContainerDiv.style.justifyContent = 'center';
    coinContainerDiv.style.margin = '5px auto';
    
    const coinContainerBg = document.createElement('img');
    coinContainerBg.src = 'assets/ui/level3/coin-container.png';
    coinContainerBg.style.position = 'absolute';
    coinContainerBg.style.width = '100%';
    coinContainerBg.style.height = '100%';
    coinContainerBg.style.objectFit = 'contain';
    coinContainerBg.style.zIndex = '1';
    
    // Moneda con imagen inicial
    const coinDiv = document.createElement('img');
    coinDiv.className = 'coin-image';
    coinDiv.id = 'coin';
    coinDiv.src = 'assets/ui/level3/inicial-coin.png';
    coinDiv.style.width = '60%';
    coinDiv.style.height = '60%';
    coinDiv.style.objectFit = 'contain';
    coinDiv.style.zIndex = '2';
    coinDiv.style.position = 'relative';
    
    coinContainerDiv.appendChild(coinContainerBg);
    coinContainerDiv.appendChild(coinDiv);
    level3Container.appendChild(coinContainerDiv);
    
    // Elección: Cara o Sello (sin título)
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
        SoundManager.play('btnCaraSelloClick');
        selectedCoin = 'cara';
        caraBtn.classList.add('selected');
        selloBtn.classList.remove('selected');
    });
    
    selloBtn.addEventListener('click', () => {
        SoundManager.play('btnCaraSelloClick');
        selectedCoin = 'sello';
        selloBtn.classList.add('selected');
        caraBtn.classList.remove('selected');
    });
    
    choiceButtons.appendChild(caraBtn);
    choiceButtons.appendChild(selloBtn);
    level3Container.appendChild(choiceButtons);
    
    // Controles sin panel contenedor (sin cuadro blanco)
    
    // Input de apuesta
    const betInputGroup = document.createElement('div');
    betInputGroup.className = 'bet-input-group';
    
    // Crear contenedor para el título
    const betLabel = document.createElement('div');
    betLabel.className = 'bet-label';
    betLabel.style.position = 'relative';
    betLabel.style.width = '100%';
    betLabel.style.display = 'flex';
    betLabel.style.alignItems = 'center';
    betLabel.style.justifyContent = 'center';
    
    // Título "CANTIDAD"
    const titleText = document.createElement('span');
    titleText.textContent = 'CANTIDAD';
    titleText.style.font = '700 14px Montserrat';
    titleText.style.color = '#ffffff';
    titleText.style.textAlign = 'center';
    
    betLabel.appendChild(titleText);
    
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
        // Reproducir sonido de tick al cambiar apuesta
        SoundManager.play('apuestaTick', { volume: 0.4 });
    });
    
    betSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        betInput.value = val;
        currentBet = val;
        // Reproducir sonido de tick al cambiar apuesta
        SoundManager.play('apuestaTick', { volume: 0.4 });
    });
    
    currentBet = Math.min(1, score);
    
    betInputGroup.appendChild(betLabel);
    betInputGroup.appendChild(betInput);
    betInputGroup.appendChild(betSlider);
    level3Container.appendChild(betInputGroup);
    
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
        // Reproducir sonido de lanzar
        SoundManager.play('btnLanzar');
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
    
    level3Container.appendChild(actionButtons);
    
    cardsContainer.appendChild(level3Container);
}

function executeCoinFlip() {
    // Deshabilitar interacción
    const allBtns = document.querySelectorAll('.choice-btn, .action-btn');
    allBtns.forEach(btn => btn.disabled = true);
    
    const coin = document.getElementById('coin');
    
    // Animación de lanzamiento - agregar clase de flip
    coin.classList.add('coin-flipping');
    
    // Reproducir sonido de moneda girando
    SoundManager.play('coinSpinning', { loop: true });
    
    setTimeout(() => {
        // Detener sonido de moneda girando
        SoundManager.stop('coinSpinning');
        // Generar resultado aleatorio
        const result = Math.random() < 0.5 ? 'cara' : 'sello';
        
        // Verificar si ganó
        const won = (result === selectedCoin);
        
        // Actualizar imagen de la moneda según resultado
        coin.classList.remove('coin-flipping');
        if (result === 'cara') {
            coin.src = 'assets/ui/level3/coin-face.png';
        } else {
            coin.src = 'assets/ui/level3/coin-tails.png';
        }
        
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
        
        // Actualizar también el contador de coins
        const coinsValue = document.getElementById('coins-value');
        if (coinsValue) coinsValue.textContent = formatScoreValue(score);
        
        // Actualizar estado
        coinFlipsRemaining--;
        isFirstFlip = false;
        
        // Mostrar resultado después de que se vea la moneda
        setTimeout(() => {
            showCoinFlipResult(won, payout, result);
        }, 500);
        
    }, 1500);
}

function showCoinFlipResult(won, payout, result) {
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'flip-result';
    
    // Moneda con resultado usando la imagen
    const coinImg = document.createElement('img');
    coinImg.className = 'result-coin-image';
    coinImg.src = result === 'cara' ? 'assets/ui/level3/coin-face.png' : 'assets/ui/level3/coin-tails.png';
    coinImg.style.width = 'min(150px, 30vw)';
    coinImg.style.height = 'min(150px, 30vw)';
    coinImg.style.objectFit = 'contain';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = won ? 'flip-message win' : 'flip-message lose';
    messageDiv.style.position = 'relative';
    messageDiv.style.width = '200px';
    messageDiv.style.height = '220px';
    messageDiv.style.display = 'flex';
    messageDiv.style.alignItems = 'center';
    messageDiv.style.justifyContent = 'center';
    messageDiv.style.padding = '0';
    messageDiv.style.borderRadius = '0';
    messageDiv.style.background = 'none';
    messageDiv.style.border = 'none';
    messageDiv.style.boxShadow = 'none';
    
    // Usar las imágenes correct.png o incorrect.png
    const messageImg = document.createElement('img');
    if (won) {
        messageImg.src = 'assets/ui/common/correct.png';
        messageImg.alt = '¡Correcto!';
    } else {
        messageImg.src = 'assets/ui/common/incorrect.png';
        messageImg.alt = '¡Incorrecto!';
    }
    messageImg.style.width = '100%';
    messageImg.style.height = '100%';
    messageImg.style.objectFit = 'contain';
    messageDiv.appendChild(messageImg);
    
    // Crear animación numérica
    const pointsText = document.createElement('div');
    pointsText.className = 'points-animation';
    // Calcular puntos ganados/perdidos
    if (won) {
        const pointsGained = payout - currentBet; // Ganancia neta
        pointsText.textContent = `+${formatScoreValue(pointsGained)}`;
        pointsText.classList.add('points-positive');
        // Reproducir sonido de acierto
        SoundManager.play('aciertoJingle');
    } else {
        pointsText.textContent = `-${formatScoreValue(currentBet)}`;
        pointsText.classList.add('points-negative');
        // Reproducir sonido de fallo
        SoundManager.play('falloGrave');
    }
    messageDiv.appendChild(pointsText);
    
    // Iniciar animación después de un pequeño delay
    setTimeout(() => {
        pointsText.classList.add('animate');
    }, 100);
    
    // Eliminar el elemento después de la animación
    setTimeout(() => {
        if (pointsText.parentNode) {
            pointsText.parentNode.removeChild(pointsText);
        }
    }, 2000);
    
    const bankDiv = document.createElement('div');
    bankDiv.className = 'bank-display';
    bankDiv.style.display = 'flex';
    bankDiv.style.alignItems = 'center';
    bankDiv.style.justifyContent = 'center';
    bankDiv.style.gap = '8px';
    
    const coinsImg = document.createElement('img');
    coinsImg.src = 'assets/ui/level3/coins.png';
    coinsImg.alt = 'Monedas';
    coinsImg.style.width = '40px';
    coinsImg.style.height = '40px';
    coinsImg.style.objectFit = 'contain';
    
    const coinsValue = document.createElement('span');
    coinsValue.textContent = formatScoreValue(score);
    coinsValue.style.font = '700 18px Montserrat';
    coinsValue.style.color = '#ffffff';
    
    bankDiv.appendChild(coinsImg);
    bankDiv.appendChild(coinsValue);
    
    resultDiv.appendChild(coinImg);
    resultDiv.appendChild(messageDiv);
    resultDiv.appendChild(bankDiv);
    
    // Botón para continuar
    const continueBtn = document.createElement('button');
    continueBtn.className = 'continue-btn';
    continueBtn.style.background = 'none';
    continueBtn.style.border = 'none';
    continueBtn.style.padding = '0';
    continueBtn.style.cursor = 'pointer';
    
    const continueImg = document.createElement('img');
    continueImg.src = 'assets/ui/common/continue.png';
    continueImg.alt = 'Continuar';
    continueImg.style.width = '100%';
    continueImg.style.height = '100%';
    continueImg.style.objectFit = 'contain';
    continueImg.style.display = 'block';
    continueBtn.appendChild(continueImg);
    
    // Decidir qué hacer según el estado
    if (score < 1) {
        // No puede seguir apostando
        continueBtn.addEventListener('click', () => endLevel3());
    } else if (coinFlipsRemaining <= 0) {
        // Sin rondas restantes
        continueBtn.addEventListener('click', () => endLevel3());
    } else {
        // Puede continuar
        continueBtn.addEventListener('click', () => {
            // Reset selección y volver a mostrar imagen inicial
            selectedCoin = null;
            renderLevel3();
        });
    }
    
    resultDiv.appendChild(continueBtn);
    cardsContainer.appendChild(resultDiv);
}

function endLevel3() {
    if (!cardsContainer) return;
    
    // Cambiar el fondo del game-screen a la imagen de puntuación
    const gameScreen = document.querySelector('.game-screen');
    if (gameScreen) {
        gameScreen.style.backgroundImage = 'url(assets/puntuacionf.png)';
        gameScreen.style.backgroundSize = 'cover';
        gameScreen.style.backgroundPosition = 'center';
        gameScreen.style.backgroundRepeat = 'no-repeat';
    }
    
    // Ocultar los contadores superiores
    const countersBar = document.querySelector('.counters-bar');
    if (countersBar) {
        countersBar.style.display = 'none';
    }
    
    // Ocultar el header del nivel
    const levelHeader = document.querySelector('.level-header');
    if (levelHeader) {
        levelHeader.style.display = 'none';
    }
    
    cardsContainer.innerHTML = '';
    
    const endDiv = document.createElement('div');
    endDiv.className = 'game-end-final';
    
    // Solo mostrar los puntos (ajusta la posición según tu diseño de imagen)
    const finalScoreDiv = document.createElement('div');
    finalScoreDiv.className = 'final-score-value';
    finalScoreDiv.textContent = formatScoreValue(score);
    finalScoreDiv.style.font = '900 min(120px, 20vw) Montserrat';
    finalScoreDiv.style.color = '#ffffff';
    finalScoreDiv.style.textShadow = '4px 4px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)';
    finalScoreDiv.style.textAlign = 'center';
    finalScoreDiv.style.position = 'relative';
    finalScoreDiv.style.zIndex = '10';
    finalScoreDiv.style.fontWeight = '900';
    finalScoreDiv.style.letterSpacing = '2px';
    // Text stroke para hacerlo más bold
    finalScoreDiv.style.webkitTextStroke = '3px rgba(0,0,0,0.3)';
    finalScoreDiv.style.textStroke = '3px rgba(0,0,0,0.3)';
    // Ajusta estos valores según donde quieras que aparezcan los puntos en tu imagen
    // Puedes cambiar marginTop para desplazar verticalmente
    finalScoreDiv.style.marginTop = 'min(300px, 40vh)';
    finalScoreDiv.style.marginBottom = '20px';
    
    endDiv.appendChild(finalScoreDiv);
    
    // Botón de jugar de nuevo
    const restartBtn = document.createElement('button');
    restartBtn.className = 'restart-btn-final';
    restartBtn.textContent = 'Jugar de Nuevo';
    restartBtn.addEventListener('click', () => location.reload());
    restartBtn.style.marginTop = '20px';
    restartBtn.style.position = 'relative';
    restartBtn.style.zIndex = '10';
    restartBtn.style.background = '#d0b9d9';
    restartBtn.style.borderRadius = '30px';
    restartBtn.style.fontWeight = '900';
    restartBtn.style.border = '6px solid white';
    restartBtn.style.padding = '14px 32px';
    restartBtn.style.cursor = 'pointer';
    restartBtn.style.transition = 'all .2s ease';
    restartBtn.style.boxShadow = '0 6px 18px rgba(208, 185, 217, .3)';
    
    endDiv.appendChild(restartBtn);
    
    cardsContainer.appendChild(endDiv);
}
