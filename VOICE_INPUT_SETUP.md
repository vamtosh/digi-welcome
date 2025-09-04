# Voice Input Setup Guide

This application now supports voice input using OpenAI's Whisper API alongside traditional keyboard input.

## Features

### 🎤 Hybrid Input Component
- **Dual Input**: Type or speak your input using the same interface
- **Smart Processing**: Different modes for different input types (PAN vs general text)
- **Real-time Feedback**: Visual indicators for recording and processing states
- **Error Handling**: Comprehensive error handling with user-friendly messages

### 🔧 Whisper API Integration
- **High Accuracy**: Uses OpenAI's Whisper-1 model for superior speech recognition
- **Optimized for PAN**: Special processing for PAN number recognition
- **Language Support**: Configurable language settings
- **Confidence Scoring**: Provides confidence levels for transcriptions

## Setup Instructions

### 1. Environment Configuration

1. Copy `.env_example` to `.env`:
   ```bash
   cp .env_example .env
   ```

2. Add your OpenAI API key to `.env`:
   ```env
   VITE_OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

### 2. API Key Configuration

You can configure the API key in two ways:

#### Option A: Environment Variable (Recommended for Production)
- Set `VITE_OPENAI_API_KEY` in your `.env` file
- The application will automatically detect and use this key

#### Option B: Settings UI (For Development/Testing)
- Open the AI Assistant settings (gear icon in chat panel)
- Enter your API key in the settings dialog
- The key will be stored locally in your browser

### 3. Usage

#### PAN Input
- Navigate to the PAN capture screen
- Use the "Type" tab for hybrid input
- Click the microphone icon to start voice input
- Speak your PAN clearly: "A B C D E 1 2 3 4 F"
- The system will automatically clean and format the input

#### Chat Input
- Use the chat panel on the right side
- Click the microphone icon in the input field
- Speak your question or message
- The system will transcribe and send your message

## Technical Details

### Components

1. **HybridInput** (`src/components/HybridInput.tsx`)
   - Reusable component for voice + keyboard input
   - Supports different modes (PAN, general)
   - Handles recording, processing, and error states

2. **WhisperService** (`src/lib/whisper.ts`)
   - Manages OpenAI Whisper API integration
   - Handles audio recording and transcription
   - Provides specialized processing for different input types

3. **Updated ChatSettings** (`src/components/ChatSettings.tsx`)
   - Shows Whisper API configuration status
   - Displays environment variable detection
   - Allows manual API key configuration

### Audio Processing

- **Format**: WebM with Opus codec
- **Sample Rate**: 16kHz (optimized for speech)
- **Features**: Echo cancellation, noise suppression
- **Processing**: Automatic cleaning and formatting

### Error Handling

The system handles various error scenarios:
- Missing API key
- Microphone permissions denied
- Network/API errors
- Invalid audio format
- Transcription failures

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Safari: Full support
- ✅ Firefox: Full support
- ❌ Internet Explorer: Not supported

## Security Notes

- API keys are stored locally in the browser
- Audio is processed in real-time and not stored
- All communication with OpenAI is encrypted
- No audio data is persisted on the server

## Troubleshooting

### Voice Input Not Working
1. Check if API key is configured in settings
2. Ensure microphone permissions are granted
3. Verify internet connection
4. Check browser console for error messages

### Poor Transcription Quality
1. Speak clearly and at normal pace
2. Reduce background noise
3. Use a good quality microphone
4. For PAN numbers, spell out each character

### API Errors
1. Verify API key is valid and has sufficient credits
2. Check OpenAI service status
3. Ensure API key has Whisper API access
4. Check rate limits and quotas

## Development

### Adding Voice Input to New Components

```tsx
import { HybridInput } from '@/components/HybridInput';

function MyComponent() {
  const [value, setValue] = useState('');
  
  return (
    <HybridInput
      value={value}
      onChange={setValue}
      placeholder="Type or speak..."
      mode="general" // or "pan" for PAN-specific processing
    />
  );
}
```

### Customizing Whisper Settings

```tsx
import { whisperService } from '@/lib/whisper';

// Set custom language
await whisperService.transcribeAudio(audioBlob, 'es'); // Spanish

// Get transcription with confidence
const result = await whisperService.transcribeAudio(audioBlob);
console.log(result.confidence); // Confidence score
```
