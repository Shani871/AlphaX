import asyncio
import numpy as np
import sounddevice as sd
import math
import time
import threading

class AudioHardwareManager:
    def __init__(self, energy_threshold_db=-40.0, vad_hold_time=0.150):
        self.input_samplerate = 16000
        self.output_samplerate = 24000
        self.channels = 1
        self.dtype = 'int16'
        
        self.frame_duration_ms = 100
        self.samples_per_frame = int(self.input_samplerate * (self.frame_duration_ms / 1000.0))
        self.bytes_per_chunk = self.samples_per_frame * 2
        
        self.energy_threshold_db = energy_threshold_db
        self.vad_hold_time = vad_hold_time
        
        self.is_user_speaking = False
        self.interrupt_event = asyncio.Event()
        
        self.outbound_queue = asyncio.Queue()
        
        self.capture_stream = None
        self.playback_stream = None
        
        self.last_speaking_start = 0.0
        self.is_currently_over_threshold = False
        
        self._capture_buffer = bytearray()
        self._is_playing = False
        
        self._loop = None
        self._playback_lock = threading.Lock()
        
    def _calculate_rms_db(self, data: bytes) -> float:
        audio_data = np.frombuffer(data, dtype=np.int16)
        if len(audio_data) == 0:
            return -100.0
        audio_float = audio_data.astype(np.float32) / 32768.0
        rms = np.sqrt(np.mean(audio_float**2))
        if rms > 0:
            return 20 * math.log10(rms)
        return -100.0

    def _audio_callback(self, indata, frames, time_info, status):
        if status:
            pass # can log status if needed
            
        self._capture_buffer.extend(indata)
        
        while len(self._capture_buffer) >= self.bytes_per_chunk:
            chunk = bytes(self._capture_buffer[:self.bytes_per_chunk])
            del self._capture_buffer[:self.bytes_per_chunk]
            
            rms_db = self._calculate_rms_db(chunk)
            current_time = time.time()
            
            if rms_db > self.energy_threshold_db:
                if not self.is_currently_over_threshold:
                    self.is_currently_over_threshold = True
                    self.last_speaking_start = current_time
                elif (current_time - self.last_speaking_start) >= self.vad_hold_time:
                    if not self.is_user_speaking:
                        self.is_user_speaking = True
                        if self._is_playing:
                            if self._loop:
                                self._loop.call_soon_threadsafe(self.abort_playback)
            else:
                self.is_currently_over_threshold = False
                self.is_user_speaking = False
                
            if self._loop:
                self._loop.call_soon_threadsafe(self.outbound_queue.put_nowait, chunk)

    async def start_capture(self):
        self._loop = asyncio.get_running_loop()
        
        self.capture_stream = sd.RawInputStream(
            samplerate=self.input_samplerate,
            channels=self.channels,
            dtype=self.dtype,
            callback=self._audio_callback
        )
        self.capture_stream.start()
        
        with self._playback_lock:
            self.playback_stream = sd.RawOutputStream(
                samplerate=self.output_samplerate,
                channels=self.channels,
                dtype=self.dtype
            )
            self.playback_stream.start()

    async def get_audio_chunk(self):
        return await self.outbound_queue.get()

    async def play_audio_chunk(self, data: bytes):
        if self.interrupt_event.is_set():
            return
            
        self._is_playing = True
        try:
            if self._loop:
                # Use thread to prevent blocking the async loop with synchronous stream write
                await self._loop.run_in_executor(None, self._write_to_stream, data)
        finally:
            self._is_playing = False

    def _write_to_stream(self, data: bytes):
        with self._playback_lock:
            if self.playback_stream and not self.playback_stream.closed:
                try:
                    self.playback_stream.write(data)
                except Exception:
                    # Exception occurs if playback_stream.abort() is called mid-write
                    pass

    def abort_playback(self):
        """Immediately flush the ring buffer and drop queued chunks, signaling upstream."""
        self.interrupt_event.set()
        with self._playback_lock:
            if self.playback_stream and not self.playback_stream.closed:
                self.playback_stream.abort() # Flushes internal ring buffer immediately
                self.playback_stream.start() # Reset stream for next playback session
                
    def reset_interrupt(self):
        self.interrupt_event.clear()
        
    def stop(self):
        if self.capture_stream:
            self.capture_stream.stop()
            self.capture_stream.close()
        with self._playback_lock:
            if self.playback_stream:
                self.playback_stream.stop()
                self.playback_stream.close()
