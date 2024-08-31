use wasm_bindgen::prelude::*;
use web_sys::{AudioContext, AudioDestinationNode, AudioNode};
use js_sys::{ArrayBuffer, Uint8Array};

#[wasm_bindgen]
pub struct AudioPlayer {
    audio_context: AudioContext,
    buffer_source: Option<web_sys::AudioBufferSourceNode>,
}

#[wasm_bindgen]
impl AudioPlayer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<AudioPlayer, JsValue> {
        let audio_context = AudioContext::new()?;
        Ok(AudioPlayer {
            audio_context,
            buffer_source: None,
        })
    }

    #[wasm_bindgen]
    pub fn load_audio(&mut self, audio_data: &[u8]) -> Result<(), JsValue> {
        let array_buffer = ArrayBuffer::new(audio_data.len() as u32);
        Uint8Array::new(&array_buffer).copy_from(audio_data);

        let promise = self.audio_context.decode_audio_data(&array_buffer)?;
        let audio_buffer = wasm_bindgen_futures::JsFuture::from(promise).await?;
        let audio_buffer: web_sys::AudioBuffer = audio_buffer.dyn_into()?;

        let buffer_source = self.audio_context.create_buffer_source()?;
        buffer_source.set_buffer(Some(&audio_buffer));
        buffer_source.connect_with_audio_node(&self.audio_context.destination())?;

        self.buffer_source = Some(buffer_source);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn play(&self) -> Result<(), JsValue> {
        if let Some(buffer_source) = &self.buffer_source {
            buffer_source.start()?;
        }
        Ok(())
    }

    #[wasm_bindgen]
    pub fn stop(&mut self) -> Result<(), JsValue> {
        if let Some(buffer_source) = &self.buffer_source {
            buffer_source.stop()?;
        }
        self.buffer_source = None;
        Ok(())
    }
}
