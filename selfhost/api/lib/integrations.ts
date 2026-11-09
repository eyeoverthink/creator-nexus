import { invokeLLM } from './llm.ts';
import { saveFile, signedUrl } from './files.ts';
import { HttpError } from './db.ts';
import type { User } from './query.ts';

// Base44 "Core" integrations, implemented on the user's own stack.
export async function runCore(name: string, input: any, user: User): Promise<any> {
  switch (name) {
    case 'InvokeLLM': return invokeLLM(input);
    case 'UploadFile': case 'UploadPublicFile': return saveFile(input?.file, 'public', user);
    case 'UploadPrivateFile': return saveFile(input?.file, 'private', user);
    case 'CreateFileSignedUrl': return signedUrl(input?.file_uri, input?.expires_in);
    // TODO(selfhost): FLUX.1-schnell / SDXL-Turbo via ComfyUI on FRAYMUS-HOME, or fraymus-video-studio.
    case 'GenerateImage': throw new HttpError(501, 'Image generation is not wired up on the self-hosted server yet.');
    // TODO(selfhost): queue a Nexus runner job (Kokoro TTS / render) instead.
    case 'GenerateSpeech': case 'GenerateVideo': throw new HttpError(501, `${name} is not wired up on the self-hosted server yet; use the Nexus runner jobs.`);
    case 'SendEmail': throw new HttpError(501, 'E-mail sending is not configured on the self-hosted server.');
    case 'ExtractDataFromUploadedFile': throw new HttpError(501, 'File data extraction is not wired up on the self-hosted server yet.');
    default: throw new HttpError(404, `Unknown integration Core.${name}`);
  }
}
