package app.memora;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.DocumentsContract;
import android.provider.Settings;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contenedor nativo de Memora. Sirve la galería web desde los assets del APK
 * (https://memora.app/ es un origen interno: no sale a internet) y agrega:
 * selector de carpetas del sistema, exportación a carpetas reales y la burbuja
 * flotante sobre otras apps (BubbleService).
 */
public class MainActivity extends Activity {
    static final String HOST = "memora.app";
    static final int REQ_PICK_SOURCE = 1;
    static final int REQ_PICK_DEST = 2;
    static final int MAX_FILES = 8000;

    WebView web;
    ValueCallback<Uri[]> fileCallback;
    volatile String lastFolder = "Carpeta";
    Uri destTree;
    final Map<String, Uri> destDirs = new HashMap<>();
    SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        prefs = getSharedPreferences("memora", MODE_PRIVATE);
        web = new WebView(this);
        web.setBackgroundColor(0x00000000); // transparente: se ve la app de atrás
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(true);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                return serveAsset(u.getPath());
            }

            // API 24+ (minSdk 24): se compila contra android-23, por eso sin @Override.
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try {
                    startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), REQ_PICK_SOURCE);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "MemoraNative");
        setContentView(web);
        if (saved == null) web.loadUrl("https://" + HOST + "/index.html");
        else web.restoreState(saved);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /* ---------- Assets ---------- */

    WebResourceResponse serveAsset(String path) {
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        if (path.contains("..")) return notFound();
        String mime = mimeFor(path);
        try {
            InputStream in = getAssets().open("www" + path);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            boolean text = mime.startsWith("text/") || mime.contains("json") || mime.contains("javascript") || mime.contains("svg");
            return new WebResourceResponse(mime, text ? "utf-8" : null, 200, "OK", headers, in);
        } catch (Exception e) {
            return notFound();
        }
    }

    WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
    }

    static String mimeFor(String p) {
        p = p.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json") || p.endsWith(".webmanifest")) return "application/json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    /* ---------- Selector de carpetas ---------- */

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        final Uri tree = (result == RESULT_OK && data != null) ? data.getData() : null;
        if (req == REQ_PICK_SOURCE) {
            final ValueCallback<Uri[]> cb = fileCallback;
            fileCallback = null;
            if (cb == null) return;
            if (tree == null) { cb.onReceiveValue(null); return; }
            try {
                getContentResolver().takePersistableUriPermission(tree, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } catch (Exception ignored) { }
            lastFolder = folderName(tree);
            new Thread(new Runnable() {
                public void run() {
                    final List<Uri> out = new ArrayList<>();
                    try {
                        walk(tree, DocumentsContract.getTreeDocumentId(tree), out, 0);
                    } catch (Exception ignored) { }
                    runOnUiThread(new Runnable() {
                        public void run() { cb.onReceiveValue(out.toArray(new Uri[0])); }
                    });
                }
            }).start();
        } else if (req == REQ_PICK_DEST) {
            destTree = tree;
            destDirs.clear();
            if (tree != null) {
                try {
                    getContentResolver().takePersistableUriPermission(tree,
                            Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                } catch (Exception ignored) { }
            }
            web.evaluateJavascript("window.__memoraNativeDest && window.__memoraNativeDest(" + (tree != null) + ")", null);
        }
    }

    String folderName(Uri tree) {
        String id = DocumentsContract.getTreeDocumentId(tree);
        String name = id;
        int colon = id.lastIndexOf(':');
        if (colon >= 0) name = id.substring(colon + 1);
        int slash = name.lastIndexOf('/');
        if (slash >= 0) name = name.substring(slash + 1);
        return name.isEmpty() ? "Almacenamiento" : name;
    }

    void walk(Uri tree, String docId, List<Uri> out, int depth) {
        if (out.size() >= MAX_FILES) return;
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, docId);
        Cursor c = getContentResolver().query(children, new String[]{
                DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                DocumentsContract.Document.COLUMN_MIME_TYPE,
                DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null);
        if (c == null) return;
        try {
            while (c.moveToNext() && out.size() < MAX_FILES) {
                String id = c.getString(0), mime = c.getString(1), name = c.getString(2);
                if (name == null || name.startsWith(".")) continue;
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) {
                    if (depth < 6) walk(tree, id, out, depth + 1);
                } else if (mime != null && mime.startsWith("image/")) {
                    out.add(DocumentsContract.buildDocumentUriUsingTree(tree, id));
                }
            }
        } finally {
            c.close();
        }
    }

    /* ---------- Exportación a carpetas reales ---------- */

    Uri destDir(String folder) throws Exception {
        Uri cached = destDirs.get(folder);
        if (cached != null) return cached;
        ContentResolver cr = getContentResolver();
        String rootId = DocumentsContract.getTreeDocumentId(destTree);
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(destTree, rootId);
        Cursor c = cr.query(children, new String[]{
                DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                DocumentsContract.Document.COLUMN_MIME_TYPE,
                DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null);
        Uri found = null;
        if (c != null) {
            try {
                while (c.moveToNext()) {
                    if (DocumentsContract.Document.MIME_TYPE_DIR.equals(c.getString(1)) && folder.equals(c.getString(2))) {
                        found = DocumentsContract.buildDocumentUriUsingTree(destTree, c.getString(0));
                        break;
                    }
                }
            } finally {
                c.close();
            }
        }
        if (found == null) {
            Uri root = DocumentsContract.buildDocumentUriUsingTree(destTree, rootId);
            found = DocumentsContract.createDocument(cr, root, DocumentsContract.Document.MIME_TYPE_DIR, folder);
        }
        destDirs.put(folder, found);
        return found;
    }

    /* ---------- Puente con la galería ---------- */

    class Bridge {
        @JavascriptInterface public boolean isNative() { return true; }

        @JavascriptInterface public String lastFolderName() { return lastFolder; }

        @JavascriptInterface public void pickExportDir() {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), REQ_PICK_DEST);
                    } catch (Exception e) {
                        web.evaluateJavascript("window.__memoraNativeDest && window.__memoraNativeDest(false)", null);
                    }
                }
            });
        }

        /** Copia una foto (base64) a destino/<carpeta>/<nombre>. No toca el original. */
        @JavascriptInterface public boolean saveFile(String folder, String name, String mime, String b64) {
            if (destTree == null) return false;
            try {
                Uri dir = destDir(folder);
                Uri file = DocumentsContract.createDocument(getContentResolver(), dir,
                        mime == null || mime.isEmpty() ? "image/jpeg" : mime, name);
                if (file == null) return false;
                OutputStream os = getContentResolver().openOutputStream(file);
                try { os.write(Base64.decode(b64, Base64.DEFAULT)); } finally { os.close(); }
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface public boolean canOverlay() {
            return Settings.canDrawOverlays(MainActivity.this);
        }

        @JavascriptInterface public boolean overlayEnabled() {
            return prefs.getBoolean("overlay", true);
        }

        /** Posición compartida con la burbuja nativa, en fracciones de pantalla: "x,y". */
        @JavascriptInterface public String bubblePos() {
            return prefs.getFloat("bubbleFX", -1f) + "," + prefs.getFloat("bubbleFY", 0.6f);
        }

        @JavascriptInterface public void setBubblePos(float fx, float fy) {
            prefs.edit().putFloat("bubbleFX", fx).putFloat("bubbleFY", fy).apply();
        }

        /** Cerrar la app compacta: vuelve a lo que estabas usando y queda la burbuja. */
        @JavascriptInterface public void minimize() {
            runOnUiThread(new Runnable() { public void run() { moveTaskToBack(true); } });
        }

        @JavascriptInterface public void setOverlay(boolean on) {
            prefs.edit().putBoolean("overlay", on).apply();
            if (on && !Settings.canDrawOverlays(MainActivity.this)) {
                runOnUiThread(new Runnable() {
                    public void run() {
                        try {
                            startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                    Uri.parse("package:" + getPackageName())));
                        } catch (Exception ignored) { }
                    }
                });
            }
        }

        @JavascriptInterface public void setBubbleSize(int dp) {
            prefs.edit().putInt("bubbleDp", Math.max(20, Math.min(56, dp))).apply();
        }
    }

    /* ---------- Ciclo de vida: burbuja nativa sólo fuera de la app ---------- */

    @Override
    protected void onResume() {
        super.onResume();
        stopService(new Intent(this, BubbleService.class));
        if (web != null) web.evaluateJavascript("window.__memora && window.__memora.onNativeResume && window.__memora.onNativeResume()", null);
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (prefs.getBoolean("overlay", true) && Settings.canDrawOverlays(this) && !isFinishing()) {
            BubbleService.start(this);
        }
    }

    @Override
    public void onBackPressed() {
        // La galería decide: cierra visor → persona → panel; al final vuelve a la app de atrás.
        web.evaluateJavascript("window.__memora ? window.__memora.nativeBack() : false", new ValueCallback<String>() {
            public void onReceiveValue(String handled) {
                if (!"true".equals(handled)) moveTaskToBack(true);
            }
        });
    }
}
