# Google系统语音识别调用

得看系统有没有内置，支不支持，试一下就知道了。

首先需要语音权限

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

然后就判断有没有麦克风权限了

```java
if (ContextCompat.checkSelfPermission(mContext, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
  //获得权限后续处理
    
} else {
    ActivityCompat.requestPermissions(
            mActivity,
            new String[]{Manifest.permission.RECORD_AUDIO},
            PERMISSION_REQUEST_CODE
    );
}
```

直接调用我写的工具类。

```java
package com.tosmart.commonview.utils;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.IBinder;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognitionService;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.text.TextUtils;
import android.util.Log;

import com.tosmart.commonview.R;

import java.util.ArrayList;
import java.util.Locale;

public class SpeechRecognitionUtils implements RecognitionListener {
    private final Context mContext;
    private final SRResultListener mResultListener;
    private SpeechRecognizer mSpeechRecognize;
    private final Intent mRecognitionIntent;
    private final String TAG = "SpeechRecognitionUtils";

    public interface SRResultListener {
        void onReadForSpeech();

        void onBeginningOfSpeech();

        void onFinalResult(String result);

        void onEndOfSpeech();

        void onErrorSpeech(String error);

        void SpeechDB(int dB);
    }

    private final ArrayList<String> mVoiceRecognitionErrors;

    public SpeechRecognitionUtils(Context context, SRResultListener resultListener) {
        this.mContext = context;
        this.mResultListener = resultListener;
        this.mRecognitionIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.ENGLISH);
        this.mVoiceRecognitionErrors = new ArrayList<>();
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_NETWORK_TIMEOUT));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_NETWORK));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_AUDIO));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_SERVER));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_CLIENT));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_SPEECH_TIMEOUT));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_NO_MATCH));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_RECOGNIZER_BUSY));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_INSUFFICIENT_PERMISSIONS));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_TOO_MANY_REQUESTS));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_SERVER_DISCONNECTED));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_LANGUAGE_NOT_SUPPORTED));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_LANGUAGE_UNAVAILABLE));
        mVoiceRecognitionErrors.add(mContext.getString(R.string.ERROR_CANNOT_CHECK_SUPPORT));
    }

    public boolean initRecognitionService() {
        if (!SpeechRecognizer.isRecognitionAvailable(mContext)) {
            Log.e(TAG, "There is no voice recognition service");
            return false;
        }

        // 初始化
        if (mSpeechRecognize == null) {
            String serviceComponent = Settings.Secure.getString(
                    mContext.getContentResolver(),
                    "voice_recognition_service"
            );
            if (TextUtils.isEmpty(serviceComponent)) {
                Log.e(TAG, "Failed to obtain the speech recognition service");
                return false;
            }

            ComponentName component = ComponentName.unflattenFromString(serviceComponent);
            if (component == null) {
                Log.e(TAG, "Failed to obtain the speech recognition component");
                return false;
            }

            // Service 检验
            ServiceConnection connect = new ServiceConnection() {
                @Override
                public void onServiceConnected(ComponentName name, IBinder service) {
                    Log.i(TAG, "---> onServiceConnected : " + name.getPackageName());
                }

                @Override
                public void onServiceDisconnected(ComponentName name) {
                    Log.i(TAG, "---> onServiceDisconnected : " + name.getPackageName());
                }
            };

            Intent serviceIntent = new Intent(RecognitionService.SERVICE_INTERFACE);
            serviceIntent.setComponent(component);

            try {
                boolean isServiceAvailableToBind = mContext.bindService(serviceIntent, connect, Context.BIND_AUTO_CREATE);
                Log.i("SpeechRecognition", "isServiceAvailableToBind:" + isServiceAvailableToBind);
                if (isServiceAvailableToBind) {
                    mContext.unbindService(connect);
                } else {
                    Log.e(TAG, "The voice service cannot be bound");
                }
            } catch (SecurityException e) {
                Log.e(TAG, "error:", e);
                return false;
            }

            mSpeechRecognize = SpeechRecognizer.createSpeechRecognizer(mContext, component);
            mSpeechRecognize.setRecognitionListener(this);
        }
        return true;
    }


    public void doSpeechRecognition() {
        if (mSpeechRecognize != null) {
            mSpeechRecognize.startListening(mRecognitionIntent);
        } else {
            Log.e(TAG, "Please initialize the speech recognition service.");
        }
    }

    public void stopSpeechRecognition() {
        if (mSpeechRecognize != null) {
            mSpeechRecognize.stopListening();
        } else {
            Log.e(TAG, "Please initialize the speech recognition service.");
        }
    }

    public void destroySpeechRecognition() {
        mSpeechRecognize.destroy();
    }

    @Override
    public void onReadyForSpeech(Bundle params) {
        Log.i(TAG, "---> onReadyForSpeech");
        mResultListener.onReadForSpeech();
    }

    @Override
    public void onBeginningOfSpeech() {
        Log.i(TAG, "---> onBeginningOfSpeech");
        mResultListener.onBeginningOfSpeech();
    }

    @Override
    public void onRmsChanged(float rmsdB) {
        Log.i(TAG, "---> onRmsChanged" + rmsdB);
        mResultListener.SpeechDB((int) rmsdB);
    }

    @Override
    public void onBufferReceived(byte[] buffer) {
    }

    @Override
    public void onEndOfSpeech() {
        Log.i(TAG, "---> onEndOfSpeech");
        mResultListener.onEndOfSpeech();
    }

    @Override
    public void onError(int error) {
        Log.i(TAG, "onError:" + error);
        mSpeechRecognize.cancel();
        if (0 < error && error <= mVoiceRecognitionErrors.size() + 1) {
            mResultListener.onErrorSpeech(mVoiceRecognitionErrors.get(error - 1));
        }
    }

    @Override
    public void onResults(Bundle results) {
        if (results != null && mResultListener != null) {
            ArrayList<String> partialResults = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (partialResults != null && !partialResults.isEmpty()) {
                String bestResult = partialResults.get(0);
                Log.i(TAG, "---> onResults Final=" + bestResult);
                mResultListener.onFinalResult(bestResult);
            }
        }
    }

    @Override
    public void onPartialResults(Bundle partialResults) {
        if (partialResults != null && mResultListener != null) {
            ArrayList<String> results = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (results != null && !results.isEmpty()) {
                String bestResult = results.get(0);
                Log.i(TAG, "onPartialResults Result=" + bestResult);
            }
        }
    }

    @Override
    public void onEvent(int eventType, Bundle params) {
    }
}
```

```xml
<string name="ERROR_NETWORK_TIMEOUT">Network connection timeout.</string>
<string name="ERROR_NETWORK">Network error.</string>
<string name="ERROR_AUDIO">Audio error.</string>
<string name="ERROR_SERVER">Server error.</string>
<string name="ERROR_CLIENT">Client error.</string>
<string name="ERROR_SPEECH_TIMEOUT">Speech timeout.</string>
<string name="ERROR_NO_MATCH">Speech cannot be matched, please try again.</string>
<string name="ERROR_RECOGNIZER_BUSY">Recognizer is busy.</string>
<string name="ERROR_INSUFFICIENT_PERMISSIONS">Permissions insufficient.</string>
<string name="ERROR_TOO_MANY_REQUESTS">Too many requests</string>
<string name="ERROR_SERVER_DISCONNECTED">Server disconnected.</string>
<string name="ERROR_LANGUAGE_NOT_SUPPORTED">Language is not supported.</string>
<string name="ERROR_LANGUAGE_UNAVAILABLE">Language is unavailable.</string>
<string name="ERROR_CANNOT_CHECK_SUPPORT">Check cannot support.</string>
<string name="ERROR_CONTROL">Please use the official bluetooth voice remote control.</string>
```

使用该方法来判断当前系统是否支持语音文字识别

```java
mIsVoiceRecognitionValid = mSpeechRecognitionUtils.initRecognitionService();
```

返回结果为true即可调用

```java
mSpeechRecognitionUtils.doSpeechRecognition();
```

通过接口回调得到对应的结果。