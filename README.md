# Memora · caras por carpeta

Galería **flotante** que detecta caras y agrupa las fotos por persona, **sólo de las carpetas que el usuario elige**. Todo corre en el dispositivo: no hay servidor ni subida de fotos.

## Qué hace

| Función | Dónde |
|---|---|
| Burbuja flotante de 30 px (Mini 24 / Chica 30 / Media 40), arrastrable, se pega al borde y recuerda su lugar | Burbuja · Ajustes |
| Elegir qué carpetas mirar, incluir/excluir con un interruptor, con o sin subcarpetas, reescanear, quitar | Carpetas |
| Detección facial + agrupado por persona (face-api / TensorFlow.js, modelos incluidos en `vendor/`) | Caras |
| Poner nombre, unir personas, “No es esta persona”, elegir portada | Caras → persona → foto |
| Ocultar personas o fotos sin borrarlas, y volver a mostrarlas | Ocultos |
| **Armar carpetas**: copia las fotos a una carpeta por persona (escritorio: carpeta que elijas · Android: .zip) | Caras |
| Sensibilidad del agrupado y “Reagrupar sin perder nombres” | Ajustes |
| Botón Atrás de Android cierra visor → persona → panel | — |

Los originales **nunca** se mueven ni se borran: quitar una carpeta o “Borrar todo el índice” sólo borra datos de Memora.

## Estructura

```
index.html            página demo + registro del service worker
src/widget.js         burbuja + panel (Shadow DOM, embebible en otra app)
src/scanner.js        carpetas, detección, agrupado y acciones de organización
src/exporter.js       copia a carpetas (File System Access) o .zip (JSZip)
src/db.js             IndexedDB local
src/styles.js         estilos encapsulados
sw.js                 cache offline (shell en network-first, modelos en cache-first)
vendor/               face-api 1.7.15 (MIT), JSZip 3.10.1 (MIT/GPLv3), modelos (~6,7 MB)
```

## Usarlo dentro de otra app (por ejemplo FEP)

```html
<script type="module">
  import { mountMemora } from './memora/src/widget.js';
  mountMemora();
</script>
```

Los estilos viven en Shadow DOM, así que no pisan los de la app anfitriona.

## Probar local

```bash
python3 -m http.server 8080   # y abrir http://localhost:8080
```

## Límites conocidos

- **No flota sobre otras apps de Android.** Una web/PWA sólo puede flotar dentro de su propia pantalla. Para una burbuja encima de cualquier app (tipo “chat head”) hace falta un envoltorio nativo con el permiso `SYSTEM_ALERT_WINDOW` (por ejemplo Capacitor + plugin de overlay).
- **Android/iOS:** el selector de carpeta (`webkitdirectory`) da acceso sólo durante la sesión. Las caras, nombres y miniaturas quedan guardados, pero para reescanear o exportar originales hay que volver a elegir la carpeta. En Chrome de escritorio el acceso se recuerda (pide confirmar con un toque).
- **HEIC** (fotos de iPhone) no se puede decodificar en la mayoría de los navegadores: se cuentan como “sin formato compatible”.
- El primer escaneo descarga ~7 MB de modelos (después quedan en caché). Sin GPU (WebGL) cae a CPU y es más lento.

## App de Android (APK)

`android/` tiene un contenedor nativo mínimo (sin Gradle) que:

- carga la galería desde el propio APK (funciona sin internet);
- usa el selector de carpetas del sistema y recorre subcarpetas;
- **Armar carpetas** crea carpetas reales por persona en el destino que elijas;
- **Burbuja sobre otras apps** (Ajustes): al salir de Memora queda una burbuja de 30 dp flotando encima de cualquier app. Pide el permiso “Mostrar sobre otras apps” y muestra una notificación fija mientras está activa (Android lo exige).

Compilar: ver `android/build-apk.sh`. La clave de firma no se guarda en el repo.
