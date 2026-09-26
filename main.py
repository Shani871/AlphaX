import asyncio
import sys
import os
import traceback

def validate_api_key():
    if not os.environ.get("GEMINI_API_KEY"):
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
            
        if not os.environ.get("GEMINI_API_KEY"):
            print("\n[ERROR] GEMINI_API_KEY is missing from environment!")
            print("Please run: $env:GEMINI_API_KEY='your_api_key'")
            print("Or create a .env file with GEMINI_API_KEY=your_api_key")
            sys.exit(1)

validate_api_key()

from engine.audio_io import AudioHardwareManager
from engine.gemini_live import GeminiLiveBridge
from engine.transcribe_translate import TranscribeEngine, LiveTranslateEngine
from engine.ui_bridge import ui_bridge

async def main():
    print("Initializing AURALIVE Engine...")
    print("[VOICE PERSONA] Active: Aoede (Tactical Natural Female)")
    print("[BUFFER ENGINE] 24kHz / 512-block Jitter-Resilient Stream")
    print("[AEC / GATE] 80Hz High-Pass & Dynamic RMS Active")
    try:
        audio_manager = AudioHardwareManager()
        live_bridge = GeminiLiveBridge(audio_manager)
        transcribe_engine = TranscribeEngine(audio_manager)
        translate_engine = LiveTranslateEngine(audio_manager)
        
        ui_bridge.set_audio_manager(audio_manager)
        ui_task = asyncio.create_task(ui_bridge.start_server())

        # Start hardware capture
        await audio_manager.start_capture()
        
        # Connect to Gemini services
        live_task = asyncio.create_task(live_bridge.connect_and_run())
        transcribe_task = asyncio.create_task(transcribe_engine.connect_and_run())
        translate_task = asyncio.create_task(translate_engine.connect_and_run())
        
        print("All engine components online. Listening for audio...")
        
        await asyncio.gather(
            ui_task,
            live_task,
            transcribe_task,
            translate_task
        )
    except asyncio.CancelledError:
        pass
    except Exception as e:
        traceback.print_exc()
    finally:
        if 'audio_manager' in locals():
            audio_manager.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nGracefully shutting down AURALIVE Engine on Ctrl+C...")
        sys.exit(0)
    except Exception as e:
        traceback.print_exc()
        sys.exit(1)
