import asyncio
import numpy as np
import sounddevice as sd
import threading
import sys

class AudioHardwareManager:
    def __init__(self):
        self.is_ai_speaking = False
        self.interruption_event = asyncio.Event()
        
        self.audio_queue = asyncio.Queue()
        self.playback_queue = asyncio.Queue()
        
        self.capture_stream = None
        self.playback_stream = None
        self._loop = None
        self._playback_lock = threading.Lock()
        self._stop_event = threading.Event()
        
    def _audio_callback(self, indata, frames, time_info, status):
        if status:
            pass
        
        # Compute real-time RMS energy
        audio_float = np.frombuffer(indata, dtype=np.int16).astype(np.float32)
        rms = np.sqrt(np.mean(audio_float**2)) if len(audio_float) > 0 else 0.0
        
        # Double-talk threshold vs normal speaking threshold
        threshold = 1800 if self.is_ai_speaking else 600
        
        if rms > threshold:
            if self.is_ai_speaking:
                if self._loop:
                    self._loop.call_soon_threadsafe(self._trigger_barge_in)
                    
        if self._loop:
            self._loop.call_soon_threadsafe(self.audio_queue.put_nowait, bytes(indata))

    def _trigger_barge_in(self):
        sys.stdout.write("\n[BARGE-IN DETECTED] Cutting AI voice and resetting context...\n")
        sys.stdout.flush()
        self.abort_playback()
        self.interruption_event.set()

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
            blocksize=1024
        )
        self.playback_stream.start()
        print("[SPEAKER READY] 24kHz Duplex Output Active")
        
        self._playback_task = self._loop.create_task(self._playback_loop())

    async def get_audio_chunk(self) -> bytes | None:
        return await self.audio_queue.get()

    async def play_audio_chunk(self, data: bytes):
        await self.playback_queue.put(data)

    async def _playback_loop(self):
        while not self._stop_event.is_set():
            try:
                data = await asyncio.wait_for(self.playback_queue.get(), timeout=0.1)
                if data is None:
                    break
                self.is_ai_speaking = True
                await self._loop.run_in_executor(None, self._write_to_stream, data)
            except asyncio.TimeoutError:
                self.is_ai_speaking = False
            except Exception as e:
                import traceback
                traceback.print_exc()

    def _write_to_stream(self, data: bytes):
        with self._playback_lock:
            if self.playback_stream and not self.playback_stream.closed:
                try:
                    self.playback_stream.write(data)
                except Exception:
                    pass

    def abort_playback(self):
        # 1. Clear all pending chunks from the output queue immediately
        while not self.playback_queue.empty():
            try:
                self.playback_queue.get_nowait()
            except asyncio.QueueEmpty:
                break
        
        # 2. Write zero-filled silence blocks to the stream buffer
        with self._playback_lock:
            if self.playback_stream and not self.playback_stream.closed:
                try:
                    self.playback_stream.abort()
                    self.playback_stream.start()
                    silence = np.zeros(1024, dtype=np.int16).tobytes()
                    self.playback_stream.write(silence)
                except Exception:
                    pass
                    
        # 3. Set is_ai_speaking to False
        self.is_ai_speaking = False

    def stop(self):
        self._stop_event.set()
        if self.capture_stream:
            self.capture_stream.stop()
            self.capture_stream.close()
        if self.playback_stream:
            self.playback_stream.stop()
            self.playback_stream.close()
