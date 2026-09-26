import asyncio
import traceback
import sys
from google import genai
from google.genai import types
from engine.audio_io import AudioHardwareManager
from engine.ui_bridge import ui_bridge

class TranscribeEngine:
    def __init__(self, audio_manager: AudioHardwareManager):
        self.audio_manager = audio_manager
        self.client = genai.Client()
        self.transcribe_model = "gemini-3.5-transcribe-live"
        self.audio_queue = self.audio_manager.subscribe()
        
        config_kwargs = {
            "response_modalities": ["TEXT"],
        }
        if hasattr(types, "AudioTranscriptionConfig"):
            config_kwargs["input_audio_transcription"] = types.AudioTranscriptionConfig(
                language_codes=[],
                custom_vocabulary=["flight vector", "coordinates", "medical status", "AuraLive"],
            )
            
        self.config = types.LiveConnectConfig(**config_kwargs)
        self.session = None

    async def connect_and_run(self):
        while True:
            try:
                async with self.client.aio.live.connect(model=self.transcribe_model, config=self.config) as session:
                    self.session = session
                    print("Connected to Gemini Live Transcription.")
                    
                    send_task = asyncio.create_task(self._send_audio_loop())
                    receive_task = asyncio.create_task(self._receive_text_loop())
                    
                    done, pending = await asyncio.wait(
                        [send_task, receive_task],
                        return_when=asyncio.FIRST_EXCEPTION
                    )
                    for task in pending:
                        task.cancel()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[Transcribe Notice] Reconnecting transcription service in 3s... ({e})")
                self.session = None
                await asyncio.sleep(3)

    async def _send_audio_loop(self):
        while True:
            chunk = await self.audio_queue.get()
            if chunk is None:
                break
            if self.session:
                try:
                    await self.session.send_realtime_input(
                        audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
                    )
                except Exception:
                    pass

    async def _receive_text_loop(self):
        while True:
            if not self.session:
                await asyncio.sleep(0.1)
                continue
                
            try:
                async for response in self.session.receive():
                    server_content = response.server_content
                    if server_content:
                        text = None
                        if hasattr(server_content, 'input_transcription') and server_content.input_transcription:
                            text = getattr(server_content.input_transcription, 'text', None)
                        elif server_content.model_turn:
                            for part in server_content.model_turn.parts:
                                if part.text:
                                    text = part.text
                                    break

                        if text:
                            clean_text = text.strip()
                            print(f"[Transcription] {clean_text}")
                            
                            # Real-time automatic translation for the workspace & translate views
                            translated = await ui_bridge.translate_text(clean_text, target_lang="English")

                            await ui_bridge.broadcast_ui_event("transcript", {
                                "speaker": "Speaker",
                                "text": clean_text,
                                "translation": translated if translated != clean_text else None,
                                "is_final": True
                            })
                            await ui_bridge.broadcast_ui_event("translate_result", {
                                "original": clean_text,
                                "translated": translated,
                                "target_lang": "English"
                            })
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in transcribe receive loop: {e}")
                break

    async def send_audio(self, chunk: bytes | None):
        if self.session and chunk is not None:
            try:
                await self.session.send_realtime_input(
                    audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
                )
            except Exception:
                pass

class LiveTranslateEngine:
    def __init__(self, audio_manager: AudioHardwareManager):
        self.audio_manager = audio_manager
        self.client = genai.Client()
        self.translate_model = "gemini-3.5-live-translate-preview"
        self.audio_queue = self.audio_manager.subscribe()
        
        self.config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
        )
        if hasattr(types, 'TranslationConfig'):
            self.config.translation_config = types.TranslationConfig(target_language_code="es", echo_target_language=False)
        if hasattr(types, 'AudioTranscriptionConfig'):
            self.config.input_audio_transcription = types.AudioTranscriptionConfig()
            self.config.output_audio_transcription = types.AudioTranscriptionConfig()

        self.session = None

    async def connect_and_run(self):
        while True:
            try:
                async with self.client.aio.live.connect(model=self.translate_model, config=self.config) as session:
                    self.session = session
                    print("Connected to Gemini Live Translate (ES).")
                    
                    send_task = asyncio.create_task(self._send_audio_loop())
                    receive_task = asyncio.create_task(self._receive_loop())
                    
                    done, pending = await asyncio.wait(
                        [send_task, receive_task],
                        return_when=asyncio.FIRST_EXCEPTION
                    )
                    for task in pending:
                        task.cancel()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[Translate Notice] Reconnecting translate service in 3s... ({e})")
                self.session = None
                await asyncio.sleep(3)

    async def _send_audio_loop(self):
        while True:
            chunk = await self.audio_queue.get()
            if chunk is None:
                break
            if self.session:
                try:
                    await self.session.send_realtime_input(
                        audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
                    )
                except Exception:
                    pass

    async def _receive_loop(self):
        try:
            with open("translated_output.pcm", "wb") as sink:
                while True:
                    if not self.session:
                        await asyncio.sleep(0.1)
                        continue
                        
                    try:
                        async for response in self.session.receive():
                            server_content = response.server_content
                            if server_content:
                                if server_content.model_turn:
                                    for part in server_content.model_turn.parts:
                                        if part.inline_data:
                                            sink.write(part.inline_data.data)
                                if hasattr(server_content, 'output_transcription') and server_content.output_transcription:
                                    text = getattr(server_content.output_transcription, 'text', None)
                                    if text:
                                        print(f"[Translate ES] {text}")
                                        await ui_bridge.broadcast_ui_event("translate_result", {
                                            "original": "Voice Input",
                                            "translated": text,
                                            "target_lang": "Spanish"
                                        })
                    except asyncio.CancelledError:
                        break
                    except Exception as e:
                        print(f"Error in translate receive loop: {e}")
                        break
        except Exception as e:
            print(f"Failed to open sink: {e}")

    async def send_audio(self, chunk: bytes | None):
        if self.session and chunk is not None:
            try:
                await self.session.send_realtime_input(
                    audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
                )
            except Exception:
                pass
