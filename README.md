# Pompa · tus personas, en una pompa

**Pompa** (antes “Memora”) es una galería que reconoce las caras de las carpetas que elijas y arma un álbum por persona. Vive en una burbuja flotante que se despliega en una ventana compacta. Todo corre en el dispositivo: sin cuentas, sin nube.

## Funciones

| Función | Dónde |
|---|---|
| Burbuja flotante libre (24/30/38 px), con presencia en reposo ajustable, que despliega una ventana compacta hacia el lado con más espacio | Burbuja · Ajustes |
| Álbumes por persona: nombre, portada, unir, “No es esta persona” | Personas |
| **Buscar** personas por nombre | Personas |
| **Juntos**: fotos donde aparecen dos o más personas elegidas | Personas → Elegir |
| **Recuerdo**: presentación a pantalla completa con fundidos y zoom lento | Persona / Juntos |
| **Línea de tiempo** por mes y **Favoritas** | Fotos |
| **Duplicadas**: detecta fotos casi iguales y guarda las copias en la bóveda (nada se borra) | Fotos → Duplicadas |
| **Bóveda con PIN** para personas y fotos ocultas | Bóveda |
| **Armar carpetas**: copia las fotos a una carpeta por persona | Personas |
| Tema Sistema / Oscuro / Claro | Ajustes |
| Burbuja sobre otras apps (APK) | Ajustes |

> El PIN de la bóveda evita miradas: no cifra los archivos originales.

## Estructura

```
index.html            página demo + registro del service worker
src/widget.js         burbuja + panel (Shadow DOM, embebible en otra app)
src/scanner.js        carpetas, detección, agrupado y acciones de organización
src/exporter.js       copia a carpetas (File System Access) o .zip (JSZip)
src/db.js             IndexedDB local
src/styles.js         estilos encapsulados
sw.js                 cache offline (shell en network-first, modelos en cache-first)
vendor/               face-api 1.7.15 (MIT), JSZip 3.10.1 (MIT/GPLv3), modelos (~6,7 MB), fuentes Manrope e Instrument Serif (OFL)
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
