import asyncio
import numpy as np
import sounddevice as sd
import threading
import sys
import collections
from scipy import signal
from engine.ui_bridge import ui_bridge

class AudioHardwareManager:
    def __init__(self):
        self.is_ai_speaking = False
        self.is_interrupted = False
        self.interruption_event = asyncio.Event()
        
        self.audio_queue = asyncio.Queue()
        self.playback_queue = collections.deque()
        self.playback_remainder = b''
        self._playback_lock = threading.Lock()
        
        self.capture_stream = None
        self.playback_stream = None
        self._loop = None
        self._stop_event = threading.Event()
        
        # 80Hz High-Pass Filter for 16kHz
        self.sos = signal.butter(4, 80, 'hp', fs=16000, output='sos')
        self.zi = signal.sosfilt_zi(self.sos)
        self.double_talk_counter = 0
        
    def _audio_callback(self, indata, frames, time_info, status):
        if status:
            pass
        
        # Apply High-Pass Filter
        audio_float = np.frombuffer(indata, dtype=np.int16).astype(np.float32)
        filtered_audio, self.zi = signal.sosfilt(self.sos, audio_float, zi=self.zi)
        filtered_audio_int16 = np.clip(filtered_audio, -32768, 32767).astype(np.int16)
        
        # Compute real-time RMS energy on filtered audio
        rms = np.sqrt(np.mean(filtered_audio_int16.astype(np.float32)**2)) if len(filtered_audio_int16) > 0 else 0.0
        
        # Noise Gate: drop frames with very low energy (ambient noise)
        gate_threshold = 200
        if rms < gate_threshold:
            filtered_audio_int16.fill(0)
        
        # Double-talk threshold vs normal speaking threshold
        if self.is_ai_speaking:
            if rms > 1000:
                self.double_talk_counter += 1
                if self.double_talk_counter >= 2:
                    if self._loop:
                        self._loop.call_soon_threadsafe(self._trigger_barge_in)
                    self.double_talk_counter = 0
            else:
                self.double_talk_counter = 0
        else:
            if rms > 500:
                pass # is_user_speaking = True
                    
        if self._loop:
            self._loop.call_soon_threadsafe(self.audio_queue.put_nowait, filtered_audio_int16.tobytes())
            
        # Throttled UI broadcast (roughly every chunk)
        mic_level = min(1.0, rms / 4000.0)
        ai_level = 0.8 if self.is_ai_speaking else 0.0
        ui_bridge.broadcast_ui_event_sync("audio_wave", {
            "mic_level": mic_level,
            "ai_level": ai_level,
            "is_ai_speaking": self.is_ai_speaking
        })

    def _trigger_barge_in(self):
        sys.stdout.write("\n⚡ [BARGE-IN TRIGGERED] Speaker cut, routing live audio to Gemini...\n")
        sys.stdout.flush()
        self.abort_playback()
        self.interruption_event.set()

    def _playback_callback(self, outdata, frames, time_info, status):
        if self.is_interrupted:
            outdata[:] = b'\x00' * len(outdata)
            with self._playback_lock:
                self.playback_queue.clear()
                self.playback_remainder = b''
            self.is_ai_speaking = False
            return

        bytes_needed = len(outdata)
        out_idx = 0
        
        with self._playback_lock:
            while out_idx < bytes_needed:
                if not self.playback_remainder:
                    if not self.playback_queue:
                        break
                    self.playback_remainder = self.playback_queue.popleft()
                
                take = min(bytes_needed - out_idx, len(self.playback_remainder))
                outdata[out_idx:out_idx+take] = self.playback_remainder[:take]
                self.playback_remainder = self.playback_remainder[take:]
                out_idx += take
                
        if out_idx < bytes_needed:
            outdata[out_idx:] = b'\x00' * (bytes_needed - out_idx)
            self.is_ai_speaking = False
        else:
            self.is_ai_speaking = True

    async def start_capture(self):
        self._loop = asyncio.get_running_loop()
        
        self.capture_stream = sd.RawInputStream(
            samplerate=16000,
            channels=1,
            dtype='int16',
            blocksize=1600,
            callback=self._audio_callback
        )
        self.capture_stream.start()
        print("[MIC READY] 16kHz Mono Stream Active")
        
        self.playback_stream = sd.RawOutputStream(
            samplerate=24000,
            channels=1,
            dtype='int16',
            blocksize=512,
            callback=self._playback_callback
        )
        self.playback_stream.start()
        print("[SPEAKER READY] 24kHz Duplex Output Active")

    async def get_audio_chunk(self) -> bytes | None:
        return await self.audio_queue.get()

    async def play_audio_chunk(self, data: bytes):
        with self._playback_lock:
            self.playback_queue.append(data)

    def abort_playback(self):
        self.is_interrupted = True
        with self._playback_lock:
            self.playback_queue.clear()
            self.playback_remainder = b''
        import time
        ui_bridge.broadcast_ui_event_sync("barge_in", {"timestamp": int(time.time() * 1000)})

    def stop(self):
        self._stop_event.set()
        if self.capture_stream:
            self.capture_stream.stop()
            self.capture_stream.close()
        if self.playback_stream:
            self.playback_stream.stop()
            self.playback_stream.close()
