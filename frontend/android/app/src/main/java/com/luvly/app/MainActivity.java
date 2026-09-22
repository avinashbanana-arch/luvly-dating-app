package com.luvly.app;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        // Capacitor otherwise lets Android finish the Activity. Forward the
        // system Back action into the web app, where React dismisses modals
        // and returns to the previous in-app screen instead.
        WebView webView = getBridge().getWebView();
        webView.evaluateJavascript(
            "window.dispatchEvent(new Event('nativebackbutton'));",
            null
        );
    }
}
