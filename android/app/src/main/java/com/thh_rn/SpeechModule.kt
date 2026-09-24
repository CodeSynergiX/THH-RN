package com.thh_rn

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * SpeechModule
 * Wraps Android's built-in SpeechRecognizer with a simple RN bridge.
 *
 * JS API (accessed via NativeModules.SpeechModule):
 *   startListening(locale: string)   – begin recognition
 *   stopListening()                  – stop gracefully
 *   cancelListening()                – cancel immediately
 *   isSpeechAvailable(cb)            – check device support
 *
 * Events emitted to JS (DeviceEventEmitter):
 *   SpeechStart   – recognition started
 *   SpeechPartial – { value: string }  partial result
 *   SpeechResult  – { value: string }  final result
 *   SpeechEnd     – recognition finished
 *   SpeechError   – { code: number, message: string }
 */
class SpeechModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var recognizer: SpeechRecognizer? = null

    override fun getName(): String = "SpeechModule"

    // ─── Lifecycle ──────────────────────────────────────────────────────────

    override fun invalidate() {
        destroyRecognizer()
        super.invalidate()
    }

    // ─── JS-callable methods ─────────────────────────────────────────────────

    @ReactMethod
    fun isSpeechAvailable(callback: Callback) {
        val available = SpeechRecognizer.isRecognitionAvailable(reactContext)
        callback.invoke(available)
    }

    @ReactMethod
    fun startListening(locale: String, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                destroyRecognizer()
                recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext).also { sr ->
                    sr.setRecognitionListener(buildListener())
                }
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                             RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    // Keep listening even during brief pauses
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 3000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L)
                }
                recognizer?.startListening(intent)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ERR_START", e.message, e)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            recognizer?.stopListening()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun cancelListening(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            recognizer?.cancel()
            promise.resolve(null)
        }
    }

    // ─── Listener ────────────────────────────────────────────────────────────

    private fun buildListener(): RecognitionListener = object : RecognitionListener {

        override fun onReadyForSpeech(params: Bundle?) {
            emit("SpeechStart", null)
        }

        override fun onBeginningOfSpeech() {}

        override fun onRmsChanged(rmsdB: Float) {}

        override fun onBufferReceived(buffer: ByteArray?) {}

        override fun onEndOfSpeech() {
            emit("SpeechEnd", null)
        }

        override fun onError(error: Int) {
            val map = Arguments.createMap().apply {
                putInt("code", error)
                putString("message", speechErrorMessage(error))
            }
            emit("SpeechError", map)
        }

        override fun onResults(results: Bundle?) {
            val matches = results
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?: return
            val map = Arguments.createMap().apply {
                val arr = Arguments.createArray()
                matches.forEach { arr.pushString(it) }
                putArray("value", arr)
            }
            emit("SpeechResult", map)
        }

        override fun onPartialResults(partialResults: Bundle?) {
            val matches = partialResults
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?: return
            val map = Arguments.createMap().apply {
                val arr = Arguments.createArray()
                matches.forEach { arr.pushString(it) }
                putArray("value", arr)
            }
            emit("SpeechPartial", map)
        }

        override fun onEvent(eventType: Int, params: Bundle?) {}
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun destroyRecognizer() {
        recognizer?.destroy()
        recognizer = null
    }

    private fun emit(event: String, data: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, data)
    }

    private fun speechErrorMessage(code: Int): String = when (code) {
        SpeechRecognizer.ERROR_AUDIO               -> "Audio recording error"
        SpeechRecognizer.ERROR_CLIENT              -> "Client-side error"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
        SpeechRecognizer.ERROR_NETWORK             -> "Network error"
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT     -> "Network timeout"
        SpeechRecognizer.ERROR_NO_MATCH            -> "No speech match found"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY     -> "Recognizer busy"
        SpeechRecognizer.ERROR_SERVER              -> "Server error"
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT      -> "No speech detected"
        else                                       -> "Unknown error ($code)"
    }
}
