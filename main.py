import asyncio
import sys

from engine.audio_io import AudioHardwareManager
from engine.gemini_live import GeminiLiveBridge
from engine.transcribe_translate import TranscribeEngine, LiveTranslateEngine

async def audio_distribution_loop(audio_manager: AudioHardwareManager, 
                                  live_bridge: GeminiLiveBridge, 
                                  transcribe_engine: TranscribeEngine, 
                                  translate_engine: LiveTranslateEngine):
    """
    Consumes audio chunks from the hardware manager and distributes them 
    to all active Gemini sessions simultaneously.
    """
    print("Starting audio distribution loop...")
    while True:
        chunk = await audio_manager.get_audio_chunk()
        
        # We fan-out the audio chunk to all active sessions concurrently.
        # LiveBridge sends internally via its own loop but we can intercept or 
        # since we altered the design slightly, we'll feed them all here.
        
        # Feed Transcribe
        await transcribe_engine.send_audio(chunk)
        
        # Feed Translate
        await translate_engine.send_audio(chunk)
        
        # Feed Live Bridge
        # We can directly feed the live session here or let its own loop handle it.
        # Since live_bridge._send_audio_loop consumes from get_audio_chunk(),
        # we will actually need to change how chunks are consumed so they don't steal from each other.
        # For a robust fan-out, we distribute it manually:
        if live_bridge.session:
             await live_bridge.session.send_realtime_input(
                [live_bridge.client.types.Part.from_bytes(data=chunk, mime_type="audio/pcm;rate=16000")]
            )

async def main():
    print("Initializing AURALIVE Engine...")
    audio_manager = AudioHardwareManager()
    
    live_bridge = GeminiLiveBridge(audio_manager)
    transcribe_engine = TranscribeEngine(audio_manager)
    translate_engine = LiveTranslateEngine(audio_manager)
    
    # Start hardware capture
    await audio_manager.start_capture()
    print("Hardware capture started.")
    
    # Connect to Gemini services
    live_task = asyncio.create_task(live_bridge.connect_and_run())
    transcribe_task = asyncio.create_task(transcribe_engine.connect_and_run())
    translate_task = asyncio.create_task(translate_engine.connect_and_run())
    
    # Instead of letting each service consume from the queue independently (which steals chunks),
    # we use a master loop to pull once and broadcast to all services.
    # To do this cleanly, we'll cancel the inner loop of live_bridge in favor of master broadcast.
    
    async def master_broadcast():
        while True:
            chunk = await audio_manager.get_audio_chunk()
            tasks = []
            
            # 1. Main Live Session
            if live_bridge.session:
                from google.genai import types
                tasks.append(
                    live_bridge.session.send_realtime_input(
                        [types.Part.from_bytes(data=chunk, mime_type="audio/pcm;rate=16000")]
                    )
                )
            
            # 2. Transcribe Session
            if transcribe_engine.session:
                tasks.append(transcribe_engine.send_audio(chunk))
                
            # 3. Translate Session
            if translate_engine.session:
                tasks.append(translate_engine.send_audio(chunk))
                
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
                
    broadcast_task = asyncio.create_task(master_broadcast())
    
    print("All engine components online. Listening for audio...")
    
    try:
        await asyncio.gather(
            live_task,
            transcribe_task,
            translate_task,
            broadcast_task
        )
    except KeyboardInterrupt:
        print("\nShutting down AURALIVE Engine...")
    finally:
        audio_manager.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
