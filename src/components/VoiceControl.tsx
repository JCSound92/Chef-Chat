import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { useStore } from '../store';
import { suggestRecipes } from '../api';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const VOICE_CONTEXTS = {
  SEARCH: 'search',
  RECIPE: 'recipe',
  COOKING: 'cooking',
  SHOPPING: 'shopping'
} as const;

type VoiceContext = typeof VOICE_CONTEXTS[keyof typeof VOICE_CONTEXTS];

export function VoiceControl() {
  const navigate = useNavigate();
  const {
    voiceState,
    setVoiceState,
    currentRecipe,
    nextStep,
    previousStep,
    addToShoppingList,
    setCurrentRecipe,
    setSuggestions,
    setIsLoading,
    isCooking
  } = useStore();

  const [processingCommand, setProcessingCommand] = useState(false);
  const [currentContext, setCurrentContext] = useState<VoiceContext>(VOICE_CONTEXTS.SEARCH);
  const recognitionRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Initialize speech recognition once
  useEffect(() => {
    if (isInitializedRef.current) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setVoiceState(prev => ({ ...prev, isListening: true, error: null }));
        };

        recognition.onend = () => {
          setVoiceState(prev => ({ ...prev, isListening: false }));
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event);
          setVoiceState({
            error: `Speech recognition error: ${event.error}. Please try again.`,
            isListening: false,
            transcript: ''
          });
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          
          if (event.results[0].isFinal) {
            processVoiceCommand(transcript);
          } else {
            setVoiceState(prev => ({ ...prev, transcript }));
          }
        };

        recognitionRef.current = recognition;
        isInitializedRef.current = true;
      } else {
        setVoiceState({
          error: 'Speech recognition is not supported in this browser. Please try using Chrome.',
          isListening: false,
          transcript: ''
        });
      }
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setVoiceState({
        error: 'Failed to initialize speech recognition. Please try using Chrome.',
        isListening: false,
        transcript: ''
      });
    }
  }, [setVoiceState]);

  // Update context based on app state
  useEffect(() => {
    if (isCooking) {
      setCurrentContext(VOICE_CONTEXTS.COOKING);
    } else if (currentRecipe) {
      setCurrentContext(VOICE_CONTEXTS.RECIPE);
    } else {
      setCurrentContext(VOICE_CONTEXTS.SEARCH);
    }
  }, [isCooking, currentRecipe]);

  const handleSearchCommand = async (transcript: string) => {
    try {
      setIsLoading(true);
      const recipes = await suggestRecipes(transcript);
      setSuggestions(recipes);
      setCurrentRecipe(null);
    } catch (error) {
      setVoiceState({ 
        error: error instanceof Error ? error.message : 'Failed to search recipes',
        isListening: false 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeCommand = (command: string) => {
    if (!currentRecipe) return;

    if (command.includes('add to shopping list')) {
      addToShoppingList(currentRecipe.ingredients, currentRecipe.id);
      navigate('/shopping-list');
    } else if (command.includes('start cooking')) {
      navigate(`/cooking/${currentRecipe.id}`);
    }
  };

  const handleCookingCommand = (command: string) => {
    if (command.includes('next step')) {
      nextStep();
    } else if (command.includes('previous step') || command.includes('go back')) {
      previousStep();
    } else if (command.includes('finish cooking')) {
      navigate('/');
    }
  };

  const processVoiceCommand = async (transcript: string) => {
    if (processingCommand) return;
    
    try {
      setProcessingCommand(true);
      const command = transcript.toLowerCase();

      switch (currentContext) {
        case VOICE_CONTEXTS.SEARCH:
          await handleSearchCommand(command);
          break;
        case VOICE_CONTEXTS.RECIPE:
          handleRecipeCommand(command);
          break;
        case VOICE_CONTEXTS.COOKING:
          handleCookingCommand(command);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error processing command:', error);
      setVoiceState({ 
        error: error instanceof Error ? error.message : 'Failed to process command',
        isListening: false 
      });
    } finally {
      setProcessingCommand(false);
      setVoiceState(prev => ({ ...prev, transcript: '' }));
    }
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setVoiceState({ 
        error: 'Speech recognition not supported. Please try using Chrome.',
        isListening: false,
        transcript: ''
      });
      return;
    }

    if (processingCommand) return;

    try {
      if (voiceState.isListening) {
        recognitionRef.current.stop();
      } else {
        // Reset state before starting
        setVoiceState(prev => ({ ...prev, error: null, transcript: '' }));
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Speech recognition error:', error);
      setVoiceState({ 
        error: 'Failed to start speech recognition. Please try again.',
        isListening: false,
        transcript: ''
      });
    }
  };

  const getContextHint = () => {
    switch (currentContext) {
      case VOICE_CONTEXTS.SEARCH:
        return 'Try saying: "Show me recipes with chicken" or "Find vegetarian recipes"';
      case VOICE_CONTEXTS.RECIPE:
        return 'Try saying: "Add to shopping list" or "Start cooking"';
      case VOICE_CONTEXTS.COOKING:
        return 'Try saying: "Next step", "Previous step", or "Finish cooking"';
      default:
        return '';
    }
  };

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4">
      {(voiceState.transcript || processingCommand) && (
        <div className="bg-white p-4 rounded-xl shadow-lg max-w-md animate-fade-in">
          <p className="text-sm text-gray-600">
            {processingCommand ? 'Processing command...' : voiceState.transcript}
          </p>
          {!processingCommand && !voiceState.transcript && (
            <p className="text-xs text-gray-400 mt-2">{getContextHint()}</p>
          )}
        </div>
      )}
      {voiceState.error && (
        <div className="bg-red-50 p-4 rounded-xl shadow-lg animate-fade-in">
          <p className="text-sm text-red-600">{voiceState.error}</p>
        </div>
      )}
      <button
        onClick={toggleListening}
        disabled={processingCommand}
        className={`p-6 rounded-2xl ${
          processingCommand 
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#FF6B6B] hover:bg-[#FF5252] hover:scale-105 hover:rotate-3'
        } text-white shadow-2xl transition-all duration-300 transform`}
      >
        {voiceState.isListening ? (
          <div className="relative">
            <div className="absolute inset-0 animate-ping bg-white rounded-full blur opacity-30"></div>
            <Mic className="w-8 h-8 animate-pulse relative" />
          </div>
        ) : (
          <MicOff className="w-8 h-8" />
        )}
      </button>
    </div>
  );
}