# Pack de Pitch, Guion Técnico y Verificación Dry-Run (F6b)

> **Documento Oficial de Preparación de Pitch y Verificación en Vivo**  
> **Proyecto:** TALENTIA (SocraticGuild)  
> **Competición:** Reto 20 HACK4EDU (ProFuturo / Telefónica / Universidad Pontificia de Salamanca)  
> **Lema Contractual:** *«No buscamos talento oculto: cambiamos el instrumento que lo ocultaba».*  
> **Referencias:** `docs/SPEC.md` (§18, §19), `docs/ARCHITECTURE.md`, `docs/gates/F0-contrato.md`, `docs/gates/F0-trace.md`.  
> **Tiempo Límite de Presentación:** 6 minutos exactos (360 segundos).  
> **Fecha de Validación:** 2026-11-05.

---

## 1. Resumen Ejecutivo y Roles de Pitch

TALENTIA demuestra que las evaluaciones estandarizadas de lápiz y papel son estructuralmente ciegas ante el talento colaborativo (liderazgo, empatía, negociación, escucha activa y resolución estructurada de problemas). Frente al **Reto 20 de HACK4EDU** (_«Ningún talento pasa desapercibido»_), TALENTIA transforma una pantalla multitáctil compartida en un laboratorio cooperativo donde la IA actúa como habitante del mundo y evaluador pedagógico invisible.

### 1.1 Equipo en Escena y Asignación de Roles

| Rol                                 | Responsable              | Dispositivo / Superficie                           | Función Principal                                                                                                                                                                    |
| :---------------------------------- | :----------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Speaker / Presentador**           | Orador principal         | Micrófono de sala + Puntero                        | Conduce la narrativa frente al jurado, expone el problema, resalta las dinámicas de interacción de los niños y cierra con la visión pedagógica.                                      |
| **Operador Técnico / Docente**      | Segundo miembro          | Laptop Host (`/teacher`)                           | Configura la sesión, monitoriza el Live Mirror, acciona la Consola Silenciosa ante cualquier contingencia, gira la pantalla para el peek del panel docente y ejecuta el hard-delete. |
| **Equipo de Jugadores (Rehearsal)** | 3 a 4 niños o co-testers | Dispositivo multitáctil 10" (`/play` en proyector) | Juegan la crisis comunitaria en vivo: reclaman avatares, dialogan por voz con los PNJs, dibujan planos y colaboran para reconstruir el puente.                                       |

---

## 2. Run-of-Show de 6 Minutos Exactos (Desglose Segundo a Segundo)

El guion está cronometrado al segundo para garantizar el cumplimiento inamovible de los 6:00 minutos de presentación, reservando los últimos 30 segundos para la demostración de privacidad y preguntas del jurado.

```mermaid
timeline
    title Cronograma de Pitch TALENTIA (0:00 - 6:00)
    00:00 - 00:30 : 1. Problema y Contexto (Reto 20)
    00:30 - 01:00 : 2. Configuración /teacher y Reclamo /play
    01:00 - 04:00 : 3. Partida en Vivo (Chacra -> Taller -> Alcaldía -> Puente)
    04:00 - 04:30 : 4. Pantalla Final Colectiva /play (¡Puente listo!)
    04:30 - 05:00 : 5. Peek Panel Docente /teacher
    05:00 - 05:30 : 6. Demostración Trilingüe (Clips Quechua e Inglés)
    05:30 - 06:00 : 7. Cierre Pedagógico y Hard-Delete Ley 29733
```

---

### Bloque 1: Problema y Contexto (0:00 - 0:30 | 30 segundos)

- **Objetivo:** Plantear la tesis de ruptura pedagógica y conectar con el Reto 20 de HACK4EDU.
- **Superficie Visible en Proyector:** Pantalla de bienvenida con ilustración de la comunidad y logotipo de TALENTIA.
- **Acción de Operador:** Laptop en `/teacher` lista con el formulario de nueva sesión.

| Segundo         | Persona | Acción / Guion Verbal                                                                                                                                                                                                                                                      | Estado Visual                           |
| :-------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------- |
| **0:00 - 0:10** | Speaker | _«Buenos días, señores del jurado. ¿Cómo evalúa hoy una escuela si un niño de 8 años sabe liderar, negociar o escuchar? Le entregan una prueba estandarizada de opción múltiple. Las pruebas de papel no miden liderazgo ni empatía; solo miden memorización individual.»_ | Proyector: Portada TALENTIA.            |
| **0:10 - 0:20** | Speaker | _«Para el Reto 20 de HACK4EDU —'Ningún talento pasa desapercibido'— nuestra premisa es contundente: no buscamos talento oculto, cambiamos el instrumento que lo ocultaba.»_                                                                                                | Portada con foco en Reto 20 ProFuturo.  |
| **0:20 - 0:30** | Speaker | _«Les presentamos TALENTIA: una experiencia cooperativa en un solo dispositivo compartido donde un equipo de niños resuelve una crisis comunitaria real, mientras la IA captura evidencias genuinas de habilidades blandas sin poner una sola nota numérica a los niños.»_ | El operador abre la pestaña `/teacher`. |

---

### Bloque 2: Configuración en `/teacher` y Reclamo en `/play` (0:30 - 1:00 | 30 segundos)

- **Objetivo:** Demostrar la arquitectura asimétrica de dos rutas conectadas por WebSocket efímero sin cuentas de usuario.
- **Superficie Visible en Proyector:** `/play` proyectado en pantalla completa.
- **Laptop de Operador:** `/teacher` en pantalla integrada.

| Segundo         | Persona  | Acción / Guion Verbal                                                                                                                                                                                                                                                  | Estado Visual                                                                    |
| :-------------- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **0:30 - 0:40** | Operador | En `/teacher`: selecciona Idioma `ES`, `4` Jugadores, Duración `5:00` min. Pulsa `Nueva Sesión`. El sistema genera el código de 4 caracteres sin confusables (ej. `K7NP`).                                                                                             | Laptop: `/teacher` muestra código seguro `K7NP`. Proyector: `/play?s=K7NP`.      |
| **0:40 - 0:50** | Niños    | En `/play`, aparecen las 4 cartas Deal (`? Jugador X`). Los niños tocan su tarjeta simultáneamente en la pantalla multitáctil de 10": eligen su avatar Paper-Mario (Zorro, Búho, Rana, Gato), dictan o tipean sus nombres (Mateo, Valentina, Leo, Sofía) y pulsan `✓`. | Proyector: tarjetas de avatares cambian a color confirmado con borde distintivo. |
| **0:50 - 1:00** | Speaker  | _«Cero cuentas, cero contraseñas. Cada niño reclama su avatar físico en la pantalla táctil. Al confirmar todos, la sesión se bloquea estrictamente (`locked = true`) y comienza la cuenta regresiva.»_                                                                 | Proyector y Laptop: contador automático sincronizado `5..4..3..2..1`.            |

---

### Bloque 3: Partida en Vivo — La Crisis del Puente (1:00 - 4:00 | 3:00 minutos)

- **Objetivo:** Ejecutar la ruta crítica completa `Campamento → Chacra → Taller → Alcaldía → Puente` en ~3:30 de tiempo de juego en mock.
- **Superficie Visible en Proyector:** Diorama 3D interactivo en `/play`, rail derecho con tarjetas táctiles, barra inferior de inventario y subtítulos siempre activos (6s expiración).

#### 1:00 - 1:25 | Campamento e Introducción Narrativa (25s)

- **Acción:** Paneo cinematográfico de la cámara 3D sobre las estaciones de la aldea.
- **Voz en off (Soto):** _«Vecinos, el río creció y nos partió el puente. Estamos aislados. Necesitamos madera de la chacra, el plano del taller y el permiso comunal antes de reconstruirlo.»_
- **UI en Proyector:** Aparece la barra de checklist vacía `0/3` con los tres íconos vacíos (`madera`, `plano`, `sello`).

#### 1:25 - 2:10 | Estación 1: Chacra del Agricultor Paco (45s)

- **Movimiento:** Valentina toca el minimapa y propone: _"¿Vamos a la Chacra?"_. Se activa el banner de veto (5s). El equipo apoya. Caminata grupal auto-walk hacia el oeste.
- **Diálogo:** Al llegar, Paco saluda. Mateo presiona `hold-to-talk`: _"Don Paco, denos madera para el puente"_.
- **Rechazo Socrático:** Paco replica con la frase locked de clarificación: `¿quién ayuda y en qué?`.
- **Negociación Exitosa:** Valentina toma el micrófono: _"Yo cosecharé el maíz de la ladera y Mateo ayudará a cargar los troncos caídos"_.
- **Concesión:** Paco sonríe: _"¡Trato hecho!"_. Suena el chime de grant. El ícono de `madera` se ilumina en el inventario compartido. Checklist avanza a `1/3` (`1 Conseguir madera (chacra) ✓`).

#### 2:10 - 2:55 | Estación 2: Taller de la Ingeniera Luz (45s)

- **Movimiento:** Leo propone viajar al Taller. Votación unánime. Caminata hacia el este.
- **Interacción:** Luz revisa la madera pero exige un diseño: _"Necesito saber cómo cruzará el puente sin caer al río"_.
- **Pizarra Multitáctil de Dibujo (`hold-to-draw`):** Leo abre la pizarra de dibujo. Dibuja sobre la plantilla de trazo una estructura de vigas dobles ancladas en ambas orillas y pulsa `¡Listo!`.
- **Extracción VLM:** El modelo de visión analiza el trazado (`Describe what the drawing shows...`). Luz valida en personaje: _"¡Vigas sólidas en ambos extremos!"_.
- **Concesión:** Chime de grant. El ícono de `plano` se ilumina. Checklist avanza a `2/3` (`2 Aprobar diseño (taller) ✓`).

#### 2:55 - 3:45 | Estación 3: Alcaldía Comunal con el Alcalde Soto (50s)

- **Movimiento:** El equipo viaja a la Alcaldía en el norte-este.
- **Conflicto:** El Alcalde Soto, con voz grave y actitud terca, cuestiona al grupo: _"Para cruzar el río comunal necesitan permiso oficial. ¿Quién responderá por la obra y qué materiales tienen?"_.
- **Resolución Estructurada:** Sofía presiona su botón de voz: _"Señor Alcalde, traemos la madera de Don Paco a quien ayudamos en la chacra, tenemos el plano aprobado por la Ingeniera Luz y todo nuestro equipo trabajará junto a los vecinos"_.
- **Concesión Final:** Soto asiente: _"Cumplieron con todos los pasos ordenados"_. Estampa el sello oficial. Suena el chime. Se ilumina el `sello`. Checklist completado a `3/3` (`3 Permiso (alcaldía) ✓`).

#### 3:45 - 4:00 | Estación 4: Puente Roto Reconstruido y Cruce (15s)

- **Acción:** El equipo marcha al Puente Roto en el norte-centro (~3:30 de tiempo de juego consumido).
- **Ensamblaje 3D:** Animación automática de ensamblaje en 5 segundos pieza por pieza: pilotes, vigas y tablones unen las orillas.
- **Victoria:** El grupo cruza automáticamente el río entre vítores de los aldeanos.
- **Freeze Frame:** La escena se congela con lluvia de confeti y el título institucional locked: `¡Puente listo!`. Se dispara la evaluación pura del Jurado en segundo plano.

---

### Bloque 4: Pantalla Final Colectiva en `/play` (4:00 - 4:30 | 30 segundos)

- **Objetivo:** Mostrar el cierre lúdico colectivo sin calificaciones individuales ni comparaciones punitivas.
- **Superficie Visible en Proyector:** Pantalla de Equipo (`EquipoEndScreen.tsx`).

| Segundo         | Persona | Acción / Guion Verbal                                                                                                                                                                               | Estado Visual                                                                                           |
| :-------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **4:00 - 4:10** | Speaker | _«Observen la pantalla de los niños: ¡Puente listo! No hay ganadores ni perdedores, no hay primeros puestos. El éxito es del colectivo.»_                                                           | Proyector: Banner locked `¡Puente listo!`, ilustración de celebración, pasos 3/3.                       |
| **4:10 - 4:20** | Speaker | _«El equipo alcanzó las 3 Estrellas (3★). Esta calificación proviene de una función matemática pura basada en la suma de criterios cualitativos observados, nunca de un capricho de la IA.»_        | Animación de aparición de las 3 Estrellas doradas.                                                      |
| **4:20 - 4:30** | Speaker | _«El sistema otorga un máximo de 3 insignias de equipo priorizadas estrictamente: 'Paso a paso', 'Un solo equipo' y 'Cumplieron su promesa', cada una respaldada por una cita de conducta grupal.»_ | Visualización de las 3 insignias con citas de evidencia en lenguaje natural. Cero números individuales. |

---

### Bloque 5: Peek del Panel Docente en `/teacher` (4:30 - 5:00 | 30 segundos)

- **Objetivo:** Revelar la profundidad pedagógica analítica respetando el aislamiento estricto de rutas (D7).
- **Acción de Operador:** El operador gira físicamente su laptop hacia el jurado o la orienta a cámara. El proyector permanece en `/play`.

| Segundo         | Persona            | Acción / Guion Verbal                                                                                                                                                                                                                      | Estado Visual                                                                             |
| :-------------- | :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **4:30 - 4:40** | Operador / Speaker | _«Mientras los niños solo ven su puente reconstruido, en la laptop del docente ocurre la verdadera magia analítica. Noten el banner superior reglamentario: 'señales preliminares, no notas'.»_                                            | Laptop Operador: Panel Docente con banner superior locked obligatorio.                    |
| **4:40 - 4:50** | Speaker            | _«Cinco dimensiones de habilidades blandas evaluadas con rúbrica 0 a 2: Turn-taking, Colaboración, Negociación, Resolución Estructurada y Organización. Cada una respaldada por la cita textual exacta del niño que la evidenció.»_        | Laptop: Criterios cualitativos con barras cualitativas y citas diarizadas.                |
| **4:50 - 5:00** | Speaker            | _«Abajo, cada alumno tiene su tarjeta Paper-Mario con micro-anécdotas formativas. Por ejemplo: 'Valentina cedió la palabra para que Mateo completara su propuesta'. Información accionable para el maestro, sin etiquetar al estudiante.»_ | Laptop: Tarjetas individuales de Mateo, Valentina, Leo y Sofía con anécdotas pedagógicas. |

---

### Bloque 6: Demostración Trilingüe Fuera de la App (5:00 - 5:30 | 30 segundos)

- **Objetivo:** Demostrar la capacidad nativa en Quechua Sureño (QUZ) e Inglés (EN) sin arriesgar la estabilidad de la ruta crítica en vivo.
- **Superficie Visible en Proyector:** Vídeos cortos pregrabados ejecutados desde el reproductor multimedia del sistema o diapositiva de apoyo.

| Segundo         | Persona | Acción / Guion Verbal                                                                                                                                                                                                                                     | Estado Visual                                                                                                |
| :-------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **5:00 - 5:15** | Speaker | _«TALENTIA no traduce interfaces: piensa en tres idiomas nativos. Veamos este clip de 15 segundos en Quechua Sureño: los niños dialogan con Paco usando Meta MMS autohospedado en GPU local, sin depender de nubes externas ni penalizar pronunciación.»_ | Proyector: Clip de vídeo Quechua. Audio: _"Allillanchu Paco... maderata munayku"_. Paco responde en Quechua. |
| **5:15 - 5:30** | Speaker | _«Y aquí el mismo motor en Inglés. Idéntica rúbrica pedagógica, idéntico diorama, respetando la lengua materna de cada comunidad escolar.»_                                                                                                               | Proyector: Clip de vídeo en Inglés con Farmer Paco y Engineer Luz.                                           |

---

### Bloque 7: Cierre Pedagógico, Ley 29733 y Preguntas (5:30 - 6:00 | 30 segundos)

- **Objetivo:** Demostrar el cumplimiento riguroso de la Ley 29733 de Protección de Datos Personales de Menores de Edad y abrir el espacio de preguntas.
- **Superficie Visible:** Laptop `/teacher` mostrada al jurado; proyector vuelve a portada final.

| Segundo         | Persona  | Acción / Guion Verbal                                                                                                                                                                                                                                                                        | Estado Visual                                                                       |
| :-------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **5:30 - 5:45** | Operador | En `/teacher`, dentro de Sesiones Pasadas, pulsa `borrar sesión` sobre la sesión de prueba. Aparece el diálogo de confirmación. Al pulsar confirmar, la sesión se purga instantáneamente en cascada (transcripciones, dibujos, eventos y notas).                                             | Laptop: Lista de sesiones históricas queda limpia en tiempo real.                   |
| **5:45 - 6:00** | Speaker  | _«Cumplimos con la Ley 29733: no almacenamos audio crudo y cualquier colegio o padre puede ejercer su derecho de supresión inmediata. TALENTIA no clasifica a los niños: les da un puente para que su talento hable por sí mismo. Muchas gracias, quedamos a disposición de sus preguntas.»_ | Proyector: Slide de cierre con código QR al repositorio y contacto. Aplausos / Q&A. |

---

## 3. Checklist Técnico de Hardware, Software y Red

### 3.1 Equipamiento de Hardware

- [ ] **Laptop de Operador (Host):**
  - Procesador mínimo Intel Core i5/AMD Ryzen 5 o Apple Silicon (M1/M2/M3).
  - Mínimo 16 GB de RAM.
  - Puerto HDMI nativo o adaptador USB-C a HDMI probado con anticipación.
  - Teclado físico y touchpad operativos.
  - Batería al 100% y cargador de corriente conectado obligatoriamente.
- [ ] **Dispositivo Multitáctil de Alumnos (`/play`):**
  - Pantalla táctil de mínimo 10 pulgadas con soporte multitáctil de al menos 5 puntos simultáneos.
  - Micrófono frontal operativo probado contra ruido de fondo.
  - Altavoces frontales con volumen al 80% o altavoz externo auxiliar conectado por Jack 3.5mm/Bluetooth de baja latencia.
- [ ] **Proyector / Pantalla de Sala:**
  - Resolución nativa mínima 1080p (1920×1080 a 60Hz).
  - Conexión por cable HDMI (evitar proyecciones inalámbricas tipo Miracast/Chromecast para eliminar latencia y cortes de señal).
- [ ] **Infraestructura de Inferencia (MMS / Local GPU):**
  - Servidor de inferencia local en la misma red LAN Gigabit o Wi-Fi 5GHz de alta prioridad con IP estática fijada.
  - Puertos abiertos y sockets de baja latencia verificados.

### 3.2 Configuración de Software y Navegadores

- [ ] **Navegadores Homologados:** Google Chrome (v120+) o Microsoft Edge (v120+). Cero extensiones activas (abrir en perfil limpio sin ad-blockers).
- [ ] **Configuración de Pantalla del Sistema Operativo:**
  - Modo de pantalla: **"Extender pantallas"** (absolutamente prohibido el modo "Duplicar pantalla").
  - Pantalla principal: Laptop del operador (`/teacher`).
  - Pantalla secundaria (Proyector): Ventana exclusiva para `/play`.
- [ ] **Aislamiento Estricto de Pestañas (D7):**
  - En el software de videoconferencia o proyección de sala, compartir **únicamente la pestaña de `/play`** ("Share Tab").
  - Prohibido compartir "Pantalla completa" o el escritorio. La consola de operador y el panel docente jamás deben pisar el proyector.
- [ ] **Permisos de Navegador Pre-concedidos:**
  - Acceso al micrófono: `Permitir siempre` (sin cuadros de diálogo emergentes).
  - Reproducción automática de audio (`Autoplay`): `Habilitada` para el dominio local.
- [ ] **Servicios Backend y Almacenamiento:**
  - Entorno de ejecución Bun activo (`bun test` en verde previo a la sala).
  - Base de datos efímera / repositorio en memoria reseteado y listo para crear la sesión de demo.

---

## 4. Matriz de Contingencias con la Consola Silenciosa

La Consola Silenciosa (`OperatorConsole.tsx`) en `/teacher` permite resolver cualquier incidente en escena de manera instantánea e invisible para los niños y el jurado, manteniendo la inmersión pedagógica intacta.

| Incidente / Fallo Potencial                                    | Causa Raíz Posible                                      | Acción Inmediata del Operador (`/teacher`)                           | Efecto Visible en `/play` (Proyector)                                                                                                                   | Explicación / Salida para el Speaker                                                                    |
| :------------------------------------------------------------- | :------------------------------------------------------ | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------ |
| **Tiempo de pitch agotándose (<2 min restantes)**              | Debate extenso de los niños en una estación.            | Pulsar **`Skip a Estación`** (ej. saltar a _Alcaldía_ o _Puente_).   | Teletransporte suave con fundido (`fade`). La party aparece en la estación destino. No otorga items automáticamente.                                    | _«Los exploradores deciden avanzar rápidamente hacia la alcaldía para no perder tiempo de luz.»_        |
| **El LLM o STT no comprende la propuesta de voz**              | Ruido excesivo en la sala de pitch o modulación baja.   | Pulsar **`Force-Grant`** del hito actual (Madera, Diseño o Permiso). | Se ilumina el ícono correspondiente en el inventario con sonido de éxito. En el panel docente se marca `con apoyo docente` y estructurada queda en 1/2. | _«El alcalde escucha la determinación del equipo y concede el permiso comunal.»_                        |
| **El jurado no escuchó la locución del PNJ**                   | El jurado conversaba o hubo ruido puntual de altavoces. | Pulsar **`Replay PNJ`**.                                             | El PNJ repite exactamente su última frase en audio y subtítulo en pantalla. CERO nuevos turnos de transcripción logueados.                              | _«El agricultor Paco vuelve a recordar las condiciones del trato.»_                                     |
| **Falla técnica o caída de red en inferencia IA**              | Timeout en API de transcripción o modelo VLM.           | Pulsar **`Reintentar IA`**.                                          | Desaparece el aviso de reintento; el sistema reanuda la interacción sin reiniciar la sesión.                                                            | La dinámica continúa de forma transparente.                                                             |
| **Un niño se bloquea, llora o debe retirarse**                 | Nerviosismo en vivo o indisposición de un estudiante.   | Pulsar **`Retirar Alumno`** (con confirmación inline obligatoria).   | La tarjeta del alumno pasa a gris con la etiqueta `Retirado mm:ss`. Los demás niños continúan jugando normalmente.                                      | _«El sistema permite que un alumno descanse mientras el equipo asume el relevo cooperativo.»_           |
| **La introducción de audio se prolonga demasiado**             | Se desea acelerar la partida para priorizar Q&A.        | Pulsar **`Skip Intro`**.                                             | Cancela el paneo de cámara y el monólogo de Soto; activa inmediatamente el control de los niños.                                                        | _«Vamos directo a la acción con el equipo en el campamento.»_                                           |
| **Tiempo límite de pitch alcanzado por la campana del jurado** | Corte estricto de tiempo impuesto por los jueces.       | Pulsar **`Terminar Ahora`**.                                         | La partida se congela en fin parcial (`Misión en curso X/3`). Las estrellas se retienen (`null`) y se muestran las insignias ganadas.                   | _«Vemos cómo el sistema documenta el avance en curso y las habilidades demostradas hasta este minuto.»_ |

---

## 5. Protocolo de Cumplimiento Normativo (Ley 29733 de Protección de Datos)

En el pitch ante el jurado, el Speaker debe destacar que TALENTIA fue concebido bajo el principio de **Privacidad desde el Diseño (Privacy by Design)**:

1. **Sin Identidad Digital Permanente:** No existen correos electrónicos, cuentas de usuario, contraseñas ni identificadores gubernamentales (DNI) de los alumnos. Las tarjetas se inicializan de forma efímera para la sesión.
2. **Procesamiento de Voz sin Retención de Audio Crudo:** El flujo de voz (STT) procesa el búfer de audio en memoria para generar el texto transcrito diarizado y destruye inmediatamente el audio crudo. Cero grabaciones de voz infantil quedan almacenadas en disco.
3. **Immutabilidad de la Observación Docente:** Las notas pedagógicas del docente son de adición exclusiva (`add-only`). Nadie puede adulterar las evidencias originales del sistema.
4. **Hard-Delete Atómico y Purga en Cascada:** Al presionar `borrar sesión`, el sistema ejecuta una eliminación física en cascada que remueve:
   - Metadatos de la sesión y configuración.
   - Transcripciones completas diarizadas.
   - Dibujos, trazos y miniaturas visuales.
   - Registro histórico de eventos dual-timestamp (`game_ts_ms` y `wall_ts_ms`).
   - Evaluaciones de jurado y comentarios docentes.
5. **Derechos ARCO Inmediatos:** Cualquier padre de familia o directivo escolar puede ejercer su derecho de cancelación y el operador docente elimina la sesión en 1 solo clic demostrable en vivo.

---

## 6. Lista Maestra de las 21 Cadenas Inmutables (`LOCKED_STRINGS` - SPEC §19)

Para garantizar cero desviaciones en las inspecciones visuales del jurado y en las pruebas de regresión, se auditan las 21 cadenas obligatorias carácter por carácter:

1. `BANNER_MOVE`: `¿Vamos a X? propuso [Nombre], mantén para vetar (5s)`
2. `MOVE_EXECUTE`: `¡Vamos a X!`
3. `MID_WALK`: `llegando a X…` _(con elipsis tipográfica U+2026)_
4. `NPC_LOCK`: `escucha…` _(con elipsis tipográfica U+2026)_
5. `SIMULTANEOUS`: `espera tu turno`
6. `DRAW_CAP`: `aquí ya dibujamos suficiente, ¡hablen o vayan a otro lugar!`
7. `UNCLEAR_1`: `¿me lo repites o lo dibujas?`
8. `OVERLAP`: `oí dos voces, ¿quién lo propone?`
9. `CIRCLE_NUDGE`: `hablen entre ustedes 20s`
10. `CIRCLE_READY` / `CIRCLE_RESUME`: `listo, tenemos plan`
11. `REMOTE_NPC`: `vayan a X para hablar con Y`
12. `STALL_L3`: `vayan a X y digan Y`
13. `FARMER_CLARIFY`: `¿quién ayuda y en qué?`
14. `WIN_TITLE`: `¡Puente listo!`
15. `PARTIAL_TITLE`: `Misión en curso X/3`
16. `TEACHER_FLAG`: `con apoyo docente`
17. `DOCENTE_BANNER`: `señales preliminares, no notas`
18. `VISION_PROMPT`: `Describe what the drawing shows: objects, actions, measures, routes, labels or marks, and your confidence for each`
19. `REPEAT_ES`: `repite/repítelo/puedes repetir`
20. `REPEAT_EN`: `repeat/say again`
21. `REPEAT_QUZ`: `huktawan niway/yapaykullay`
