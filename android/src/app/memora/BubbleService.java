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
                .setContentTitle("Memora")
                .setContentText("Burbuja activa · tocá para abrir la galería")
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
        boolean left = prefs.getBoolean("bubbleLeft", false);
        lp.x = left ? 0 : dm.widthPixels - box;
        lp.y = prefs.getInt("bubbleY", (int) (dm.heightPixels * 0.6f));

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
                        boolean toLeft = lp.x + lp.width / 2 < m.widthPixels / 2;
                        lp.x = toLeft ? 0 : m.widthPixels - lp.width;
                        lp.y = Math.max(0, Math.min(lp.y, m.heightPixels - lp.height));
                        wm.updateViewLayout(bubble, lp);
                        prefs.edit().putBoolean("bubbleLeft", toLeft).putInt("bubbleY", lp.y).apply();
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

    /** Círculo carbón con borde lima y carita, igual que la burbuja web. */
    static class BubbleView extends View {
        final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint glyph = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint shadow = new Paint(Paint.ANTI_ALIAS_FLAG);
        final int dot, pad; final float d;

        BubbleView(Context c, int dot, int pad, float density) {
            super(c);
            this.dot = dot; this.pad = pad; this.d = density;
            fill.setColor(0xFF141414);
            shadow.setColor(0x55000000);
            stroke.setColor(0xFFA8E063); stroke.setStyle(Paint.Style.STROKE); stroke.setStrokeWidth(1.5f * density);
            glyph.setColor(0xFFA8E063); glyph.setStyle(Paint.Style.STROKE); glyph.setStrokeWidth(1.6f * density);
            glyph.setStrokeCap(Paint.Cap.ROUND);
            setContentDescription("Abrir Memora");
        }

        @Override
        protected void onDraw(Canvas cv) {
            float cx = pad + dot / 2f, cy = pad + dot / 2f, r = dot / 2f;
            cv.drawCircle(cx, cy + 1.5f * d, r, shadow);
            cv.drawCircle(cx, cy, r, fill);
            cv.drawCircle(cx, cy, r - stroke.getStrokeWidth() / 2, stroke);
            float s = dot / 24f;
            Paint dotP = new Paint(glyph); dotP.setStyle(Paint.Style.FILL);
            cv.drawCircle(cx - 3 * s, cy - 2 * s, 1.1f * s, dotP);
            cv.drawCircle(cx + 3 * s, cy - 2 * s, 1.1f * s, dotP);
            cv.drawArc(new RectF(cx - 3.5f * s, cy - 1.5f * s, cx + 3.5f * s, cy + 4f * s), 20, 140, false, glyph);
        }
    }
}
