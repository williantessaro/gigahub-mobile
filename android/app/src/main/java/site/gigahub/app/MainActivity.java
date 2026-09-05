package site.gigahub.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import android.speech.tts.Voice;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    private static final int RECORD_AUDIO_REQUEST_CODE = 1001;
    private TextToSpeech textToSpeech;
    private boolean isTtsReady = false;
    private float currentSpeechRate = 1.15f;
    private float currentPitch = 1.0f;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.MODIFY_AUDIO_SETTINGS
            }, RECORD_AUDIO_REQUEST_CODE);
        }

        initNativeTTS();

        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    MainActivity.this.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            request.grant(request.getResources());
                        }
                    });
                }
            });

            this.bridge.getWebView().addJavascriptInterface(new AndroidTTSInterface(), "AndroidTTS");
        }
    }

    private void initNativeTTS() {
        textToSpeech = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    int result = textToSpeech.setLanguage(new Locale("pt", "BR"));
                    if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                        isTtsReady = true;
                    }
                    textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override
                        public void onStart(String utteranceId) {}

                        @Override
                        public void onDone(String utteranceId) {
                            notifyJsSpeechEnd();
                        }

                        @Override
                        public void onError(String utteranceId) {
                            notifyJsSpeechEnd();
                        }
                    });
                }
            }
        });
    }

    private void notifyJsSpeechEnd() {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    bridge.getWebView().evaluateJavascript(
                        "if (window.onAndroidTTSEnd) { try { window.onAndroidTTSEnd(); } catch(e) {} }",
                        null
                    );
                }
            });
        }
    }

    public class AndroidTTSInterface {
        @JavascriptInterface
        public void speak(final String text) {
            if (textToSpeech != null && isTtsReady && text != null && !text.trim().isEmpty()) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        textToSpeech.setSpeechRate(currentSpeechRate);
                        textToSpeech.setPitch(currentPitch);
                        textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "GigaMenteLiveUtterance");
                    }
                });
            } else {
                notifyJsSpeechEnd();
            }
        }

        @JavascriptInterface
        public void setSpeechRate(final float rate) {
            currentSpeechRate = rate;
            if (textToSpeech != null && isTtsReady) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        textToSpeech.setSpeechRate(currentSpeechRate);
                    }
                });
            }
        }

        @JavascriptInterface
        public void setPitch(final float pitch) {
            currentPitch = pitch;
            if (textToSpeech != null && isTtsReady) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        textToSpeech.setPitch(currentPitch);
                    }
                });
            }
        }

        @JavascriptInterface
        public String getVoices() {
            if (textToSpeech != null && isTtsReady && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                try {
                    JSONArray arr = new JSONArray();
                    Set<Voice> voices = textToSpeech.getVoices();
                    if (voices != null) {
                        for (Voice v : voices) {
                            if (v.getLocale() != null && "pt".equalsIgnoreCase(v.getLocale().getLanguage())) {
                                JSONObject obj = new JSONObject();
                                obj.put("name", v.getName());
                                obj.put("locale", v.getLocale().toString());
                                obj.put("quality", v.getQuality());
                                obj.put("latency", v.getLatency());
                                obj.put("requiresNetwork", v.isNetworkConnectionRequired());
                                arr.put(obj);
                            }
                        }
                    }
                    return arr.toString();
                } catch (Exception e) {
                    return "[]";
                }
            }
            return "[]";
        }

        @JavascriptInterface
        public boolean setVoice(final String voiceName) {
            if (textToSpeech != null && isTtsReady && voiceName != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                Set<Voice> voices = textToSpeech.getVoices();
                if (voices != null) {
                    for (Voice v : voices) {
                        if (v.getName().equalsIgnoreCase(voiceName)) {
                            final Voice target = v;
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    textToSpeech.setVoice(target);
                                }
                            });
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        @JavascriptInterface
        public void stop() {
            if (textToSpeech != null) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        textToSpeech.stop();
                    }
                });
            }
        }

        @JavascriptInterface
        public boolean isAvailable() {
            return isTtsReady;
        }
    }

    @Override
    public void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
    }
}
