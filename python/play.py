import os
import threading

import ffmpeg
import pygame

from python.record import AudioRecorder

recorder = AudioRecorder()


class AudioManager:
    def __init__(self):
        pygame.init()
        pygame.mixer.init()
        self.playing = False
        self.paused = False

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
    print("quit - Exit the program")

    while True:
        command = input("Enter command: ").strip().lower()

        if command == "play":
            threading.Thread(target=audio_manager.play_audio, args=(file_path,)).start()
            recorder.start_recording()
        elif command == "pause":
            audio_manager.pause_audio()
        elif command == "resume":
            audio_manager.resume_audio()
        elif command == "stop":
            audio_manager.stop_audio()
            recorder.stop_recording()
        elif command.startswith("save "):
            output_file = command.split(maxsplit=1)[1]
            recorder.save_recording(output_file)
        elif command == "quit":
            audio_manager.stop_audio()
            break
        else:
            print("Invalid command")

    pygame.quit()


if __name__ == "__main__":
    main()
