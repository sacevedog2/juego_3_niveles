# 🔊 Guía de Sonidos del Juego

Este documento lista todos los archivos de sonido que necesitas crear e importar al proyecto.

## 📁 Estructura de Carpetas

```
assets/sounds/
├── level1/      (Sonidos del Nivel 1: Dado + Operaciones)
├── level2/      (Sonidos del Nivel 2: Comparación de Cartas)
├── level3/      (Sonidos del Nivel 3: Moneda + Apuestas)
└── common/      (Sonidos compartidos entre niveles)
```

---

## 🎲 NIVEL 1 - Dado + Operaciones Matemáticas

### `assets/sounds/level1/`

| Nombre del Archivo | Descripción | Formato Recomendado |
|-------------------|-------------|---------------------|
| `btn-girar-click.mp3` | Click energético al presionar "Girar dado" | MP3 / OGG / WAV |
| `dice-rolling.mp3` | Sonido de dado rodando (mientras gira) - estilo arcade digital/metálico | MP3 / OGG / WAV |
| `btn-operacion-click.mp3` | Click ligero al presionar botones de operaciones (+, -, ×, ÷) | MP3 / OGG / WAV |
| `resultado-positivo.mp3` | Tono ascendente brillante cuando se acierta | MP3 / OGG / WAV |
| `resultado-negativo.mp3` | Tono descendente o "bump" apagado cuando se falla | MP3 / OGG / WAV |

**Nota:** El sonido `btn-operacion-click.mp3` se usará para todos los botones de operaciones (+, -, ×, ÷).

---

## 🃏 NIVEL 2 - Mayor, Igual, Menor

### `assets/sounds/level2/`

| Nombre del Archivo | Descripción | Formato Recomendado |
|-------------------|-------------|---------------------|
| `btn-decision-click.mp3` | Click suave al presionar botones de decisión (Menor, Igual, Mayor) | MP3 / OGG / WAV |
| `acierto-victoria.mp3` | Chime ascendente de 2-3 tonos cuando se acierta | MP3 / OGG / WAV |
| `error-fallo.mp3` | Sonido de error leve: bump o tono descendente corto cuando se falla | MP3 / OGG / WAV |

---

## 🪙 NIVEL 3 - Cara o Sello + Apuesta

### `assets/sounds/level3/`

| Nombre del Archivo | Descripción | Formato Recomendado |
|-------------------|-------------|---------------------|
| `btn-cara-sello-click.mp3` | Click UI con brillo metálico sutil al presionar "Cara" o "Sello" | MP3 / OGG / WAV |
| `apuesta-tick.mp3` | Sonido de "tick" digital muy corto al subir/bajar cantidad de apuesta | MP3 / OGG / WAV |
| `btn-lanzar.mp3` | Efecto woosh + pequeño "ting" metálico al presionar "Lanzar" | MP3 / OGG / WAV |
| `coin-spinning.mp3` | Sonido de moneda girando (mientras está en el aire) - estilo metálico o woosh continuo | MP3 / OGG / WAV |
| `acierto-jingle.mp3` | Pequeño jingle ascendente o chime dinámico cuando se acierta | MP3 / OGG / WAV |
| `fallo-grave.mp3` | Tono grave, corto y apagado cuando se falla | MP3 / OGG / WAV |

---

## 📋 RESUMEN DE ARCHIVOS A CREAR

### Total: 14 archivos de sonido

**Nivel 1 (5 archivos):**
1. `btn-girar-click.mp3`
2. `dice-rolling.mp3`
3. `btn-operacion-click.mp3`
4. `resultado-positivo.mp3`
5. `resultado-negativo.mp3`

**Nivel 2 (3 archivos):**
1. `btn-decision-click.mp3`
2. `acierto-victoria.mp3`
3. `error-fallo.mp3`

**Nivel 3 (6 archivos):**
1. `btn-cara-sello-click.mp3`
2. `apuesta-tick.mp3`
3. `btn-lanzar.mp3`
4. `coin-spinning.mp3`
5. `acierto-jingle.mp3`
6. `fallo-grave.mp3`

---

## 💡 Recomendaciones de Formato

- **MP3**: Mejor compatibilidad, tamaño pequeño
- **OGG**: Buena calidad, tamaño pequeño, buena compatibilidad en navegadores modernos
- **WAV**: Máxima calidad, pero archivos más grandes

**Sugerencia:** Usa **OGG** o **MP3** para mantener los archivos pequeños y la carga rápida.

---

## 📝 Notas de Implementación

Una vez que hayas importado todos los archivos de sonido, el código JavaScript se actualizará para reproducir estos sonidos en los momentos apropiados del juego.

**Duración recomendada de los sonidos:**
- Clicks de botones: 0.1 - 0.3 segundos
- Sonidos de resultado: 0.5 - 1.5 segundos
- Sonido de dado rodando: 1 - 2 segundos (loop mientras gira)
- Sonido de lanzar moneda: 1 - 2 segundos
- Sonido de moneda girando: 1 - 1.5 segundos (loop mientras gira)

