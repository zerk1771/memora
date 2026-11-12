package app.memora;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.RectF;
import android.os.Build;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;

/** Burbuja de Memora encima de otras apps. Requiere el permiso "Mostrar sobre otras apps". */
public class BubbleService extends Service {
    static final String CHANNEL = "bubble";
    static final int TYPE_APPLICATION_OVERLAY = 2038; // API 26+
    static final int IMPORTANCE_MIN = 1;

    WindowManager wm;
    BubbleView bubble;
    WindowManager.LayoutParams lp;
    SharedPreferences prefs;

    static void start(Context ctx) {
        Intent i = new Intent(ctx, BubbleService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                Context.class.getMethod("startForegroundService", Intent.class).invoke(ctx, i);
            } else {
                ctx.startService(i);
            }
        } catch (Exception ignored) { }
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(1, buildNotification());
        if (bubble == null) addBubble();
        return START_STICKY;
    }

    PendingIntent openApp() {
        Intent i = new Intent(this, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        return PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    Notification buildNotification() {
        Notification.Builder b;
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                Class<?> chClass = Class.forName("android.app.NotificationChannel");
                Object ch = chClass.getConstructor(String.class, CharSequence.class, int.class)
                        .newInstance(CHANNEL, "Burbuja flotante", IMPORTANCE_MIN);
                NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                NotificationManager.class.getMethod("createNotificationChannel", chClass).invoke(nm, ch);
                b = Notification.Builder.class.getConstructor(Context.class, String.class).newInstance(this, CHANNEL);
            } else {
                b = new Notification.Builder(this).setPriority(Notification.PRIORITY_MIN);
            }
        } catch (Exception e) {
            b = new Notification.Builder(this);
        }
        return b.setSmallIcon(R.drawable.ic_stat)
                .setContentTitle("Pompa")
                .setContentText("La burbuja está activa · tocá para abrir")
                .setContentIntent(openApp())
                .setOngoing(true)
                .build();
    }

    void addBubble() {
        prefs = getSharedPreferences("memora", MODE_PRIVATE);
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        DisplayMetrics dm = getResources().getDisplayMetrics();
        int dot = Math.round(prefs.getInt("bubbleDp", 30) * dm.density);
        int pad = Math.round(7 * dm.density); // zona táctil cómoda alrededor del círculo
        int box = dot + pad * 2;

        bubble = new BubbleView(this, dot, pad, dm.density);
        int type = Build.VERSION.SDK_INT >= 26 ? TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        lp = new WindowManager.LayoutParams(box, box, type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.LEFT;
        float fx = prefs.getFloat("bubbleFX", -1f), fy = prefs.getFloat("bubbleFY", 0.6f);
        lp.x = fx < 0 ? dm.widthPixels - box : Math.round(fx * dm.widthPixels);
        lp.y = Math.round(fy * dm.heightPixels);

        bubble.setOnTouchListener(new View.OnTouchListener() {
            float sx, sy; int ox, oy; boolean moved;
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        sx = e.getRawX(); sy = e.getRawY(); ox = lp.x; oy = lp.y; moved = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = e.getRawX() - sx, dy = e.getRawY() - sy;
                        if (!moved && Math.hypot(dx, dy) < 12) return true;
                        moved = true;
                        lp.x = ox + (int) dx; lp.y = oy + (int) dy;
                        wm.updateViewLayout(bubble, lp);
                        return true;
                    case MotionEvent.ACTION_UP:
                        DisplayMetrics m = getResources().getDisplayMetrics();
                        if (!moved) {
                            try { openApp().send(); } catch (Exception ignored) { }
                            return true;
                        }
                        // libre: queda donde la soltás, sólo se evita que salga de la pantalla
                        lp.x = Math.max(0, Math.min(lp.x, m.widthPixels - lp.width));
                        lp.y = Math.max(0, Math.min(lp.y, m.heightPixels - lp.height));
                        wm.updateViewLayout(bubble, lp);
                        prefs.edit().putFloat("bubbleFX", lp.x / (float) m.widthPixels).putFloat("bubbleFY", lp.y / (float) m.heightPixels).apply();
                        return true;
                }
                return false;
            }
        });
        try { wm.addView(bubble, lp); } catch (Exception e) { bubble = null; stopSelf(); }
    }

    @Override
    public void onDestroy() {
        if (bubble != null && wm != null) {
            try { wm.removeView(bubble); } catch (Exception ignored) { }
        }
        bubble = null;
        super.onDestroy();
    }

    /** Círculo carbón con borde lima y fotos apiladas (galería), igual que la burbuja web. */
    static class BubbleView extends View {
        final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint glyph = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint shadow = new Paint(Paint.ANTI_ALIAS_FLAG);
        final int dot, pad; final float d;

        BubbleView(Context c, int dot, int pad, float density) {
            super(c);
            this.dot = dot; this.pad = pad; this.d = density;
            shadow.setColor(0x66000000);
            shadow.setMaskFilter(new android.graphics.BlurMaskFilter(4 * density, android.graphics.BlurMaskFilter.Blur.NORMAL));
            setLayerType(View.LAYER_TYPE_SOFTWARE, null); // necesario para la sombra difusa
            stroke.setStyle(Paint.Style.STROKE); stroke.setStrokeWidth(1.3f * density);
            glyph.setColor(0xFFE4C894); glyph.setStyle(Paint.Style.STROKE); glyph.setStrokeWidth(1.6f * density);
            glyph.setStrokeCap(Paint.Cap.ROUND); glyph.setStrokeJoin(Paint.Join.ROUND);
            setContentDescription("Abrir Pompa");
        }

        @Override
        protected void onDraw(Canvas cv) {
            float cx = pad + dot / 2f, cy = pad + dot / 2f, r = dot / 2f;
            // Burbuja de vidrio oscuro con aro champagne, igual que en la app
            cv.drawCircle(cx, cy + 2f * d, r * 0.96f, shadow);
            fill.setShader(new android.graphics.RadialGradient(cx - r * 0.35f, cy - r * 0.55f, r * 1.6f,
                    0xFF2E2E35, 0xFF0E0E11, android.graphics.Shader.TileMode.CLAMP));
            cv.drawCircle(cx, cy, r, fill);
            stroke.setShader(new android.graphics.SweepGradient(cx, cy,
                    new int[]{0xFFE4C894, 0xFFF6E7C8, 0xFFC9A46A, 0x33FFFFFF, 0xFFE4C894}, null));
            cv.drawCircle(cx, cy, r - stroke.getStrokeWidth() / 2, stroke);
            Paint hl = new Paint(Paint.ANTI_ALIAS_FLAG); hl.setColor(0x26FFFFFF);
            cv.drawOval(new RectF(cx - r * 0.45f, cy - r * 0.86f, cx + r * 0.25f, cy - r * 0.32f), hl);
            // Ícono galería en grilla de 24: foto de atrás + foto de adelante con montaña y sol
            float k = dot * 0.58f / 24f, ox = cx - 12 * k, oy = cy - 12 * k;
            Paint fillP = new Paint(glyph); fillP.setStyle(Paint.Style.FILL);
            android.graphics.Path back = new android.graphics.Path();
            back.moveTo(ox + 7 * k, oy + 4 * k); back.lineTo(ox + 18 * k, oy + 4 * k);
            back.quadTo(ox + 20 * k, oy + 4 * k, ox + 20 * k, oy + 6 * k); back.lineTo(ox + 20 * k, oy + 15 * k);
            cv.drawPath(back, glyph);
            cv.drawRoundRect(new RectF(ox + 3.5f * k, oy + 7.5f * k, ox + 16.5f * k, oy + 19.5f * k), 2 * k, 2 * k, glyph);
            cv.drawCircle(ox + 8 * k, oy + 11.5f * k, 1.3f * k, fillP);
            android.graphics.Path hill = new android.graphics.Path();
            hill.moveTo(ox + 3.5f * k, oy + 17.5f * k); hill.lineTo(ox + 7.5f * k, oy + 13.5f * k);
            hill.lineTo(ox + 10.5f * k, oy + 16.5f * k); hill.lineTo(ox + 12.5f * k, oy + 14.5f * k);
            hill.lineTo(ox + 16.5f * k, oy + 18.5f * k);
            cv.drawPath(hill, glyph);
        }
    }
}
