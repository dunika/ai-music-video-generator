import threading
import wave

import numpy as np
import sounddevice as sd


class AudioRecorder:
    def __init__(self):
        self.recording = False
        self.recorded_audio = []
        self.recording_thread = None

    def get_available_channels(self):
        try:
            device_info = sd.query_devices(sd.default.device[0], "input")
            return min(device_info["max_input_channels"], 2)
        except Exception as e:
            print(f"Error querying device info: {e}")
            return 1  # Default to mono (1 channel) if there's an issue

    def record_audio(self):
        def callback(indata, frames, time, status):
            if status:
                print(status)
            self.recorded_audio.append(indata.copy())

        channels = self.get_available_channels()

        try:
            with sd.InputStream(callback=callback, channels=channels, samplerate=44100):
                print("Recording... Press Ctrl+C to stop.")
                while self.recording:
                    sd.sleep(100)  # Allow callback to process
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


if __name__ == "__main__":
    recorder = AudioRecorder()

    print("Commands:")
    print("record - Start recording")
    print("stop - Stop recording")
    print("save <filename> - Save recording to file")
    print("quit - Exit the program")

    while True:
        command = input("Enter command: ").strip().lower()

        if command == "record":
            recorder.start_recording()
        elif command == "stop":
            recorder.stop_recording()
        elif command.startswith("save "):
            output_file = command.split(maxsplit=1)[1]
            recorder.save_recording(output_file)
        elif command == "quit":
            recorder.stop_recording()
            break
        else:
            print("Invalid command")
