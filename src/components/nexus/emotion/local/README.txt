FRAYMUS LOCAL VOCAL EMOTION — explicit, offline-audio analysis

This is a separate local runner, not a replacement for Needle3 or Ollama.
The Windows launcher extracts this kit but does not install packages, start a
server, send audio, or run model inference automatically.

1. Install/use 64-bit Python 3.11 or 3.12, not the Needle3 Python 3.14 environment.
2. Review these files and requirements.txt. In PowerShell in this kit folder:
   py -3.11 -m venv .venv
   & .\.venv\Scripts\python.exe -m pip install -r requirements.txt
3. Start an explicit analysis (a local audio picker opens):
   & .\.venv\Scripts\python.exe fraymus_vocal_analyze.py --input-kind singing_vocals
   Or pass --audio "D:\\Music\\vocals.wav". Other input kinds: speech, mixed_music.
   CPU is the default. --device cuda requires an appropriately installed CUDA
   PyTorch environment and a working compatible GPU; there is no silent fallback.
4. First execution explicitly downloads about 1.27 GB of safetensors plus config
   from the PUBLIC pinned Hugging Face commits, and verifies the weights SHA-256.
   No Hugging Face token, repository Python or pickle weights are used.
   Later, --offline requires those pinned files in the local cache.
5. Select an owned/consented WAV, FLAC or OGG file, 1–300 seconds. Inference uses
   mono 16 kHz, supplied mean/std normalization, eval/inference mode, 12-second
   non-overlapping windows and raw A/D/V regression outputs. A final subsecond
   tail is zero-padded after normalization to one second, and its true end stays
   in the report. It may take several minutes and needs sufficient local RAM.
6. The resulting <audio-name>.fraymus-emotion.json is written next to the audio.
   Back in Models > Fraymus Brain > Vocal emotion, select this small report,
   review the measurements, and Save report. Agent sharing is OFF by default.
   Enable sharing only for reports the agents should use. Audio stays on the PC;
   only your explicitly imported report enters your private workspace. Report
   basenames may identify a track, so review them before sharing with agents.

A/D/V are approximately 0–1 but are NOT probabilities; raw values are not clipped.
Arousal estimates activation; dominance estimates perceived vocal assertiveness;
valence estimates positive/negative vocal tone. This does not observe feelings.
The model is trained on English MSP-Podcast speech. The published Odyssey CCC
numbers are external speech benchmarks, not results on this PC or on singing.
Vocal stems are preferred. Singing, non-English audio, multiple speakers and
mixed music are out-of-domain or confounded. No source separation is performed.
Onset rate, autocorrelation pulse and pYIN voiced pitch are separate DSP estimates.
They are not verified tempo, meter, syllable rate or semantic cadence. No musical
key, categorical mood, confidence or emotion-to-controller conversion is invented.
Imported JSON is user-supplied, not hardware-attested or independent ground truth.
Sharing supplies context to studio/Origin helpers and Factory creation/response
song prompts only. It does not train weights or automatically modify audio.

Attribution: Goncalves et al., Odyssey2024 - Speech Emotion Recognition Challenge:
Dataset, Baseline Framework, and Results, Odyssey 2024, Quebec, Canada, June 2024.
Architecture derived from the MIT-licensed model repository:
https://huggingface.co/3loi/SER-Odyssey-Baseline-WavLM-Multi-Attributes
Pinned revision: 00d0e12ba9bf957f5aeea36e8663c8c61cb50ac9
Backbone config: microsoft/wavlm-large, c1423ed94bb01d80a3f5ce5bc39f6026a0f4828c
This kit downloads safetensors only and constructs the reviewed architecture
locally. Strict checkpoint loading refuses missing or unexpected parameters.
No downloaded custom Python executes. Review the model card and upstream license
before distributing models or datasets; access to MSP-Podcast is a separate matter.