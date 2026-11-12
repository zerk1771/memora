#!/usr/bin/env bash
# Compila Memora.apk sin Gradle: aapt + javac + dx + zipalign + apksigner (paquetes de Ubuntu:
#   apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23).
# Uso: KEYSTORE=/ruta/clave.jks KS_PASS=... ./android/build-apk.sh [salida.apk]
# La clave de firma NO va en el repo: guardala aparte; sin la misma clave no se puede actualizar la app instalada.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/android/build/Memora.apk}"
ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
: "${KEYSTORE:?Definí KEYSTORE con la ruta de la clave de firma}"
: "${KS_PASS:?Definí KS_PASS}"
B="$ROOT/android/build"
rm -rf "$B/tmp" && mkdir -p "$B/tmp/gen" "$B/tmp/classes" "$B/tmp/assets/www"

# 1) La galería web va dentro del APK (funciona sin internet)
cp -r "$ROOT/index.html" "$ROOT/manifest.webmanifest" "$ROOT/src" "$ROOT/vendor" "$ROOT/icons" "$B/tmp/assets/www/"

# 2) Recursos + R.java
aapt package -f -m -J "$B/tmp/gen" -M "$ROOT/android/AndroidManifest.xml" -S "$ROOT/android/res" \
  -A "$B/tmp/assets" -I "$ANDROID_JAR" -0 bin -F "$B/tmp/app.unsigned.apk"

# 3) Java -> bytecode -> dex
javac -nowarn -Xlint:-options -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -d "$B/tmp/classes" \
  $(find "$ROOT/android/src" "$B/tmp/gen" -name '*.java')
dalvik-exchange --dex --min-sdk-version=24 --output="$B/tmp/classes.dex" "$B/tmp/classes"
(cd "$B/tmp" && aapt add app.unsigned.apk classes.dex >/dev/null)

# 4) Alinear y firmar
zipalign -f -p 4 "$B/tmp/app.unsigned.apk" "$B/tmp/app.aligned.apk"
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --out "$OUT" "$B/tmp/app.aligned.apk"
apksigner verify "$OUT"
echo "APK listo: $OUT"
