package pt.treinomontagem.app;

import android.content.pm.ActivityInfo;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "KitchenOrientation")
public class KitchenOrientationPlugin extends Plugin {
    private boolean immersiveEnabled;

    private void syncSystemBars() {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
            getActivity().getWindow(), getActivity().getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        if (immersiveEnabled) controller.hide(WindowInsetsCompat.Type.systemBars());
        else controller.show(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (immersiveEnabled) getActivity().runOnUiThread(this::syncSystemBars);
    }

    @PluginMethod
    public void set(PluginCall call) {
        boolean active = Boolean.TRUE.equals(call.getBoolean("active", false));
        boolean immersive = Boolean.TRUE.equals(call.getBoolean("immersive", false));
        getActivity().runOnUiThread(() -> {
            immersiveEnabled = immersive;
            syncSystemBars();
            getActivity().setRequestedOrientation(active
                ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
            call.resolve();
        });
    }
}
