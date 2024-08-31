import os
import sys
import threading
import time
import wave

import ffmpeg
import numpy as np
import pygame
import sounddevice as sd


class AudioManager:
    def __init__(self):
        pygame.init()
        pygame.mixer.init()
        self.recording = False
        self.playing = False
        self.paused = False
        self.recorded_audio = []
        self.recording_thread = None

    def get_available_channels(self):
        try:
            device_info = sd.query_devices(sd.default.device[0], "input")
            return min(device_info["max_input_channels"], 2)
        except Exception as e:
            print(f"Error querying device info: {e}")
            return 1  # Default to mono (1 channel) if there's an issue

    def extract_audio(self, video_file, output_file):
        try:
            ffmpeg.input(video_file).output(output_file, format="wav").run(
                overwrite_output=True
            )
            print(f"Audio extracted to {output_file}")
        except ffmpeg.Error as e:
            print(f"Error extracting audio: {e}")
            return None
        return output_file

    def play_audio(self, file_path):
        try:
            pygame.mixer.music.load(file_path)
            pygame.mixer.music.play()
            self.playing = True
            self.paused = False
            print("Playing audio...")
            while self.playing and pygame.mixer.music.get_busy():
                pygame.time.Clock().tick(10)
        except pygame.error as e:
            print(f"Error playing audio: {e}")
        finally:
            self.playing = False

    def pause_audio(self):
        if self.playing and not self.paused:
            pygame.mixer.music.pause()
            self.paused = True
            print("Audio paused.")

    def resume_audio(self):
        if self.playing and self.paused:
            pygame.mixer.music.unpause()
            self.paused = False
            print("Audio resumed.")

    def stop_audio(self):
        if self.playing:
            pygame.mixer.music.stop()
            self.playing = False
            print("Audio stopped.")

    def record_audio(self):
        def callback(indata, frames, time, status):
            if status:
                print(status)
            self.recorded_audio.append(indata.copy())

        channels = self.get_available_channels()

        try:
            # Delay the recording start by 1 second
            time.sleep(1)
            with sd.InputStream(
                callback=callback, channels=channels, samplerate=44100, blocksize=1024
            ) as stream:
                while self.recording:
                    stream.read(44100)
                    sd.sleep(100)
        except sd.PortAudioError as e:
            print(f"Error opening InputStream with {channels} channels: {e}")
            self.recording = False

    def start_recording(self):
        if not self.recording:
            self.recording = True
            self.recorded_audio = []
            self.recording_thread = threading.Thread(target=self.record_audio)
            self.recording_thread.start()
            print("Recording started.")

    def stop_recording(self):
        if self.recording:
            self.recording = False
            if self.recording_thread is not None:
                self.recording_thread.join()  # Wait for the recording thread to finish
            print("Recording stopped.")

    def save_recording(self, output_file):
        if self.recorded_audio:
            recorded_audio = np.concatenate(self.recorded_audio, axis=0)
            with wave.open(output_file, "wb") as wf:
                wf.setnchannels(2)
                wf.setsampwidth(2)
                wf.setframerate(44100)
                wf.writeframes((recorded_audio * 32767).astype(np.int16).tobytes())
            print(f"Recording saved to {output_file}")
        else:
            print("No audio recorded.")


def main():
    file_path = input(
        "Please drag and drop the audio or video file here and press Enter: "
    ).strip()
    file_path = file_path.strip("'\"")

    if not os.path.exists(file_path):
        print("The file does not exist. Please try again.")
        return

    print(f"File path: '{file_path}'")
    audio_manager = AudioManager()

    valid_audio_extensions = [".mp3", ".ogg", ".wav"]
    _, file_extension = os.path.splitext(file_path)

    if file_extension.lower() not in valid_audio_extensions:
        print("Detected video file, extracting audio...")
        output_audio_file = os.path.splitext(file_path)[0] + ".wav"
        file_path = audio_manager.extract_audio(file_path, output_audio_file)
        if not file_path:
            print("Failed to extract audio from video.")
            return

    print("Commands:")
    print("play - Start audio playback")
    print("pause - Pause audio playback")
    print("resume - Resume audio playback")
    print("stop - Stop audio playback")
    print("record - Start recording")
    print("stoprecord - Stop recording")
    print("save <filename> - Save recording to file")
    print("quit - Exit the program")

    while True:
        command = input("Enter command: ").strip().lower()

        if command == "play":
            threading.Thread(target=audio_manager.play_audio, args=(file_path,)).start()
            audio_manager.start_recording()
        elif command == "pause":
            audio_manager.pause_audio()
        elif command == "resume":
            audio_manager.resume_audio()
        elif command == "stop":
            audio_manager.stop_audio()
            audio_manager.stop_recording()
        elif command == "record":
            audio_manager.start_recording()
        elif command == "stoprecord":
            audio_manager.stop_recording()
        elif command.startswith("save "):
            output_file = command.split(maxsplit=1)[1]
            audio_manager.save_recording(output_file)
        elif command == "quit":
            audio_manager.stop_audio()
            audio_manager.stop_recording()
            break
        else:
            print("Invalid command")

    pygame.quit()


if __name__ == "__main__":
    main()
