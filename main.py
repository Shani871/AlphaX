import asyncio
import sys
import traceback

from engine.audio_io import AudioHardwareManager
from engine.gemini_live import GeminiLiveBridge
from engine.transcribe_translate import TranscribeEngine, LiveTranslateEngine

async def main():
    print("Initializing AURALIVE Engine...")
    try:
        audio_manager = AudioHardwareManager()
        live_bridge = GeminiLiveBridge(audio_manager)
        transcribe_engine = TranscribeEngine(audio_manager)
        translate_engine = LiveTranslateEngine(audio_manager)
        
        # Start hardware capture
        await audio_manager.start_capture()
        
        # Connect to Gemini services
        live_task = asyncio.create_task(live_bridge.connect_and_run())
        transcribe_task = asyncio.create_task(transcribe_engine.connect_and_run())
        translate_task = asyncio.create_task(translate_engine.connect_and_run())
        
        print("All engine components online. Listening for audio...")
        
        await asyncio.gather(
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
