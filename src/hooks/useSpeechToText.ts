/**
 * useSpeechToText
 * Uses our custom native SpeechModule (Android SpeechRecognizer) — zero third-party dependencies.
 * Emits live partial results and a final result when recognition ends.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { requestMicPermission } from '../services/deviceCapture';
import { useToast } from '../context/ToastContext';

const { SpeechModule } = NativeModules;

export interface SpeechToTextOptions {
  /** BCP-47 locale e.g. 'en-IN' | 'gu-IN' | 'hi-IN' */
  locale?: string;
  /** Called with each partial result as the user speaks */
  onPartialResult?: (text: string) => void;
  /** Called when a final result is committed */
  onFinalResult?: (text: string) => void;
}

export function useSpeechToText(options: SpeechToTextOptions = {}) {
  const { locale = 'en-IN', onPartialResult, onFinalResult } = options;
  const { showToast } = useToast();

  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partialRef = useRef(onPartialResult);
  const finalRef = useRef(onFinalResult);
  partialRef.current = onPartialResult;
  finalRef.current = onFinalResult;

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subs = [
      DeviceEventEmitter.addListener('SpeechStart', () => {
        setListening(true);
        setError(null);
      }),

      DeviceEventEmitter.addListener(
        'SpeechPartial',
        (e: { value: string[] }) => {
          const best = e?.value?.[0] ?? '';
          if (best) partialRef.current?.(best);
        },
      ),

      DeviceEventEmitter.addListener(
        'SpeechResult',
        (e: { value: string[] }) => {
          const best = e?.value?.[0] ?? '';
          if (best) {
            partialRef.current?.(best);
            finalRef.current?.(best);
          }
          setListening(false);
        },
      ),

      DeviceEventEmitter.addListener('SpeechEnd', () => {
        setListening(false);
      }),

      DeviceEventEmitter.addListener(
        'SpeechError',
        (e: { code: number; message: string }) => {
          setListening(false);
          // Codes 7 (no match) and 5 (client error on stop) are benign — skip alert
          if (e?.code !== 7 && e?.code !== 5) {
            setError(e?.message ?? 'Speech recognition error');
          }
        },
      ),
    ];

    return () => subs.forEach(s => s.remove());
  }, []);

  const start = useCallback(async () => {
    if (listening) return;
    if (Platform.OS !== 'android') {
      showToast(
        'Voice input is currently supported on Android only.',
        'warning',
        'Not supported',
      );
      return;
    }
    if (!SpeechModule) {
      showToast(
        'Speech module not loaded. Please rebuild the app.',
        'warning',
        'Speech unavailable',
      );
      return;
    }

    const hasMic = await requestMicPermission();
    if (!hasMic) {
      showToast(
        'Please grant microphone access to use voice input.',
        'warning',
        'Microphone Permission Required',
      );
      return;
    }

    try {
      setError(null);
      await SpeechModule.startListening(locale);
    } catch (err: any) {
      setError(err?.message ?? 'Could not start speech recognition');
    }
  }, [listening, locale, showToast]);

  const stop = useCallback(async () => {
    if (!listening) return;
    try {
      await SpeechModule?.stopListening();
    } catch {
      // already stopped — ignore
    }
  }, [listening]);

  const toggle = useCallback(async () => {
    if (listening) {
      await stop();
    } else {
      await start();
    }
  }, [listening, start, stop]);

  return { listening, error, start, stop, toggle };
}
