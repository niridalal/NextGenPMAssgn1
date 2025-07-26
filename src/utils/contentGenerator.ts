import { Flashcard, QuizQuestion } from '../types';

export const generateFlashcards = (text: string): Flashcard[] => {
  const flashcards: Flashcard[] = [];
  
  // Clean and prepare text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 30);
  const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  
  // Target count based on content length
  const targetCount = Math.min(Math.max(8, Math.floor(text.length / 600)), 20);
  
  // Extract meaningful content from the document
  const meaningfulContent = extractMeaningfulContent(cleanText);
  
  // Generate flashcards from extracted content
  meaningfulContent.forEach((content, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: content.question,
        answer: content.answer,
        category: content.category
      });
    }
  });
  
  // If we don't have enough quality content, create some from key sentences
  if (flashcards.length < Math.floor(targetCount * 0.6)) {
    const keyInfo = extractKeyInformation(sentences);
    keyInfo.forEach(info => {
      if (flashcards.length < targetCount) {
        flashcards.push({
          id: flashcards.length + 1,
          question: info.question,
          answer: info.answer,
          category: info.category
        });
      }
    });
  }
  
  return flashcards.slice(0, targetCount);
};

export const generateQuizQuestions = (text: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Target count based on content length
  const targetCount = Math.min(Math.max(6, Math.floor(text.length / 800)), 15);
  
  // Extract quiz-worthy content from the document
  const quizContent = extractQuizContent(cleanText);
  
  // Generate quiz questions from extracted content
  quizContent.forEach((content, index) => {
    if (questions.length < targetCount) {
      const options = [content.correctAnswer, ...content.distractors];
      const shuffledOptions = shuffleArray(options);
      const correctIndex = shuffledOptions.indexOf(content.correctAnswer);
      
      questions.push({
        id: questions.length + 1,
        question: content.question,
        options: shuffledOptions,
        correctAnswer: correctIndex,
        explanation: content.explanation
      });
    }
  });
  
  return questions.slice(0, targetCount);
};

// Extract meaningful content for flashcards
const extractMeaningfulContent = (text: string): Array<{question: string, answer: string, category: string}> => {
  const content: Array<{question: string, answer: string, category: string}> = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // 1. Extract definitions and explanations
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    
    // Pattern: "X is Y" or "X means Y" or "X refers to Y"
    const definitionMatch = trimmed.match(/^(.+?)\s+(?:is|means|refers to|represents|denotes)\s+(.+)$/i);
    if (definitionMatch && definitionMatch[1].length < 100 && definitionMatch[2].length > 15) {
      const term = definitionMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const definition = definitionMatch[2].trim();
      
      if (!isGenericContent(term) && !isGenericContent(definition)) {
        content.push({
          question: `What is ${term}?`,
          answer: definition,
          category: 'Definition'
        });
      }
    }
    
    // Pattern: "X involves Y" or "X includes Y" or "X consists of Y"
    const processMatch = trimmed.match(/^(.+?)\s+(?:involves|includes|consists of|comprises|contains)\s+(.+)$/i);
    if (processMatch && processMatch[1].length < 80 && processMatch[2].length > 20) {
      const subject = processMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const process = processMatch[2].trim();
      
      if (!isGenericContent(subject) && !isGenericContent(process)) {
        content.push({
          question: `What does ${subject} involve?`,
          answer: process,
          category: 'Process'
        });
      }
    }
    
    // Pattern: "X causes Y" or "X results in Y" or "X leads to Y"
    const causeMatch = trimmed.match(/^(.+?)\s+(?:causes|results in|leads to|produces|creates)\s+(.+)$/i);
    if (causeMatch && causeMatch[1].length < 80 && causeMatch[2].length > 15) {
      const cause = causeMatch[1].trim();
      const effect = causeMatch[2].trim();
      
      if (!isGenericContent(cause) && !isGenericContent(effect)) {
        content.push({
          question: `What does ${cause} cause?`,
          answer: effect,
          category: 'Cause & Effect'
        });
      }
    }
    
    // Pattern: "X can be used for Y" or "X is used to Y"
    const purposeMatch = trimmed.match(/^(.+?)\s+(?:can be used for|is used to|is used for|serves to|helps to)\s+(.+)$/i);
    if (purposeMatch && purposeMatch[1].length < 80 && purposeMatch[2].length > 15) {
      const tool = purposeMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const purpose = purposeMatch[2].trim();
      
      if (!isGenericContent(tool) && !isGenericContent(purpose)) {
        content.push({
          question: `What is ${tool} used for?`,
          answer: purpose,
          category: 'Application'
        });
      }
    }
    
    // Pattern: "X has Y characteristics/properties/features"
    const characteristicMatch = trimmed.match(/^(.+?)\s+(?:has|have|possesses|exhibits|displays)\s+(.+?)\s+(?:characteristics|properties|features|attributes|qualities)$/i);
    if (characteristicMatch && characteristicMatch[1].length < 80 && characteristicMatch[2].length > 10) {
      const subject = characteristicMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const characteristics = characteristicMatch[2].trim();
      
      if (!isGenericContent(subject) && !isGenericContent(characteristics)) {
        content.push({
          question: `What characteristics does ${subject} have?`,
          answer: `${characteristics} characteristics`,
          category: 'Characteristics'
        });
      }
    }
  });
  
  // 2. Extract key facts from longer sentences
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 60 && trimmed.length < 200) {
      // Look for sentences with specific numbers, dates, or important facts
      if (/\b(?:\d+%|\d+\s+(?:years?|months?|days?|hours?)|19\d{2}|20\d{2}|\$\d+|\d+\s+(?:million|billion|thousand))\b/i.test(trimmed)) {
        // Extract the key fact
        const factMatch = trimmed.match(/^(.+?)\s+(?:was|were|is|are|has|have|contains|includes)\s+(.+)$/i);
        if (factMatch && factMatch[1].length < 60 && factMatch[2].length > 10) {
          const subject = factMatch[1].trim();
          const fact = factMatch[2].trim();
          
          if (!isGenericContent(subject)) {
            content.push({
              question: `What fact is mentioned about ${subject}?`,
              answer: fact,
              category: 'Fact'
            });
          }
        }
      }
    }
  });
  
  // 3. Extract comparisons
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    
    // Pattern: "Unlike X, Y does Z" or "While X does Y, Z does W"
    const comparisonMatch = trimmed.match(/^(?:Unlike|While|Whereas)\s+(.+?),\s+(.+)$/i);
    if (comparisonMatch && comparisonMatch[1].length < 80 && comparisonMatch[2].length > 15) {
      const item1 = comparisonMatch[1].trim();
      const comparison = comparisonMatch[2].trim();
      
      if (!isGenericContent(item1)) {
        content.push({
          question: `How does this differ from ${item1}?`,
          answer: comparison,
          category: 'Comparison'
        });
      }
    }
    
    // Pattern: "X is different from Y because Z"
    const differenceMatch = trimmed.match(/^(.+?)\s+(?:is different from|differs from|contrasts with)\s+(.+?)\s+because\s+(.+)$/i);
    if (differenceMatch && differenceMatch[1].length < 60 && differenceMatch[3].length > 15) {
      const item1 = differenceMatch[1].trim();
      const item2 = differenceMatch[2].trim();
      const reason = differenceMatch[3].trim();
      
      if (!isGenericContent(item1) && !isGenericContent(item2)) {
        content.push({
          question: `How does ${item1} differ from ${item2}?`,
          answer: reason,
          category: 'Comparison'
        });
      }
    }
  });
  
  return content;
};

// Extract content suitable for quiz questions
const extractQuizContent = (text: string): Array<{question: string, correctAnswer: string, distractors: string[], explanation: string}> => {
  const content: Array<{question: string, correctAnswer: string, distractors: string[], explanation: string}> = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // 1. Extract factual information for quiz questions
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    
    // Pattern: "X is Y" - create "What is X?" question
    const definitionMatch = trimmed.match(/^(.+?)\s+is\s+(.+)$/i);
    if (definitionMatch && definitionMatch[1].length < 80 && definitionMatch[2].length > 15 && definitionMatch[2].length < 150) {
      const term = definitionMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const definition = definitionMatch[2].trim();
      
      if (!isGenericContent(term) && !isGenericContent(definition)) {
        const distractors = generateContextualDistractors(definition, text, 'definition');
        content.push({
          question: `What is ${term}?`,
          correctAnswer: definition,
          distractors: distractors,
          explanation: `${term} is defined as ${definition}. This is explicitly stated in the document.`
        });
      }
    }
    
    // Pattern: "X does Y" or "X performs Y" - create "What does X do?" question
    const actionMatch = trimmed.match(/^(.+?)\s+(?:does|performs|executes|carries out|accomplishes)\s+(.+)$/i);
    if (actionMatch && actionMatch[1].length < 80 && actionMatch[2].length > 15) {
      const actor = actionMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const action = actionMatch[2].trim();
      
      if (!isGenericContent(actor) && !isGenericContent(action)) {
        const distractors = generateContextualDistractors(action, text, 'action');
        content.push({
          question: `What does ${actor} do?`,
          correctAnswer: action,
          distractors: distractors,
          explanation: `According to the document, ${actor} ${action}.`
        });
      }
    }
    
    // Pattern: "X has Y" - create "What does X have?" question
    const hasMatch = trimmed.match(/^(.+?)\s+(?:has|have|possesses|contains|includes)\s+(.+)$/i);
    if (hasMatch && hasMatch[1].length < 80 && hasMatch[2].length > 15 && hasMatch[2].length < 120) {
      const subject = hasMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const object = hasMatch[2].trim();
      
      if (!isGenericContent(subject) && !isGenericContent(object)) {
        const distractors = generateContextualDistractors(object, text, 'possession');
        content.push({
          question: `What does ${subject} have?`,
          correctAnswer: object,
          distractors: distractors,
          explanation: `The document states that ${subject} has ${object}.`
        });
      }
    }
    
    // Pattern: "X occurs when Y" or "X happens when Y" - create "When does X occur?" question
    const conditionMatch = trimmed.match(/^(.+?)\s+(?:occurs|happens|takes place)\s+when\s+(.+)$/i);
    if (conditionMatch && conditionMatch[1].length < 80 && conditionMatch[2].length > 15) {
      const event = conditionMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const condition = conditionMatch[2].trim();
      
      if (!isGenericContent(event) && !isGenericContent(condition)) {
        const distractors = generateContextualDistractors(condition, text, 'condition');
        content.push({
          question: `When does ${event} occur?`,
          correctAnswer: `when ${condition}`,
          distractors: distractors,
          explanation: `According to the document, ${event} occurs when ${condition}.`
        });
      }
    }
    
    // Pattern: "X is located in Y" or "X can be found in Y" - create "Where is X located?" question
    const locationMatch = trimmed.match(/^(.+?)\s+(?:is located in|can be found in|exists in|is situated in)\s+(.+)$/i);
    if (locationMatch && locationMatch[1].length < 80 && locationMatch[2].length > 10) {
      const item = locationMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const location = locationMatch[2].trim();
      
      if (!isGenericContent(item) && !isGenericContent(location)) {
        const distractors = generateContextualDistractors(location, text, 'location');
        content.push({
          question: `Where is ${item} located?`,
          correctAnswer: location,
          distractors: distractors,
          explanation: `The document indicates that ${item} is located in ${location}.`
        });
      }
    }
  });
  
  // 2. Extract numerical facts
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    
    // Look for sentences with specific numbers
    const numberMatch = trimmed.match(/^(.+?)\s+(?:is|are|was|were|contains|includes|has|have)\s+(.+?\b(?:\d+%|\d+\s+(?:years?|months?|days?|hours?|minutes?|seconds?)|19\d{2}|20\d{2}|\$\d+|\d+\s+(?:million|billion|thousand|hundred))\b.*)$/i);
    if (numberMatch && numberMatch[1].length < 80 && numberMatch[2].length > 10) {
      const subject = numberMatch[1].trim().replace(/^(The|A|An)\s+/i, '');
      const numericalFact = numberMatch[2].trim();
      
      if (!isGenericContent(subject)) {
        const distractors = generateNumericalDistractors(numericalFact);
        content.push({
          question: `What numerical fact is mentioned about ${subject}?`,
          correctAnswer: numericalFact,
          distractors: distractors,
          explanation: `The document states that ${subject} ${numericalFact}.`
        });
      }
    }
  });
  
  return content;
};

// Extract key information from sentences for fallback flashcards
const extractKeyInformation = (sentences: string[]): Array<{question: string, answer: string, category: string}> => {
  const keyInfo: Array<{question: string, answer: string, category: string}> = [];
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 40 && trimmed.length < 200) {
      // Look for sentences that contain important information
      if (containsImportantInfo(trimmed)) {
        // Create a question based on the sentence structure
        const subject = extractSubject(trimmed);
        if (subject && subject.length > 3 && subject.length < 60) {
          keyInfo.push({
            question: `What is mentioned about ${subject}?`,
            answer: trimmed,
            category: 'Key Information'
          });
        }
      }
    }
  });
  
  return keyInfo.slice(0, 8);
};

// Generate contextual distractors based on document content
const generateContextualDistractors = (correctAnswer: string, fullText: string, type: string): string[] => {
  const distractors: string[] = [];
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Find similar content in the document to use as distractors
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed !== correctAnswer && trimmed.length > 15 && trimmed.length < 150) {
      // Look for sentences with similar patterns based on type
      let isRelevantDistractor = false;
      
      switch (type) {
        case 'definition':
          isRelevantDistractor = /\b(?:is|are|means|refers to|represents)\b/i.test(trimmed);
          break;
        case 'action':
          isRelevantDistractor = /\b(?:does|performs|executes|carries out|accomplishes)\b/i.test(trimmed);
          break;
        case 'possession':
          isRelevantDistractor = /\b(?:has|have|possesses|contains|includes)\b/i.test(trimmed);
          break;
        case 'condition':
          isRelevantDistractor = /\b(?:when|if|during|while|as)\b/i.test(trimmed);
          break;
        case 'location':
          isRelevantDistractor = /\b(?:in|at|on|within|inside|outside)\b/i.test(trimmed);
          break;
      }
      
      if (isRelevantDistractor && distractors.length < 3) {
        // Extract the relevant part of the sentence
        const relevantPart = extractRelevantPart(trimmed, type);
        if (relevantPart && relevantPart !== correctAnswer && relevantPart.length > 10) {
          distractors.push(relevantPart);
        }
      }
    }
  });
  
  // Fill remaining slots with generic but plausible distractors
  while (distractors.length < 3) {
    const genericDistractors = getGenericDistractors(type);
    const randomDistractor = genericDistractors[Math.floor(Math.random() * genericDistractors.length)];
    if (!distractors.includes(randomDistractor)) {
      distractors.push(randomDistractor);
    }
  }
  
  return distractors.slice(0, 3);
};

// Generate numerical distractors
const generateNumericalDistractors = (correctAnswer: string): string[] => {
  const distractors: string[] = [];
  
  // Extract numbers from the correct answer
  const numbers = correctAnswer.match(/\d+/g);
  if (numbers) {
    numbers.forEach(num => {
      const value = parseInt(num);
      // Create variations of the number
      const variations = [
        correctAnswer.replace(num, String(Math.floor(value * 0.8))),
        correctAnswer.replace(num, String(Math.floor(value * 1.2))),
        correctAnswer.replace(num, String(Math.floor(value * 0.5)))
      ];
      
      variations.forEach(variation => {
        if (variation !== correctAnswer && distractors.length < 3) {
          distractors.push(variation);
        }
      });
    });
  }
  
  // Fill with generic numerical distractors if needed
  while (distractors.length < 3) {
    const genericNumerical = [
      'approximately 50% of the total amount',
      'between 10 and 20 units on average',
      'roughly 75% of the maximum capacity',
      'around 100 units per standard measurement'
    ];
    
    const randomDistractor = genericNumerical[Math.floor(Math.random() * genericNumerical.length)];
    if (!distractors.includes(randomDistractor)) {
      distractors.push(randomDistractor);
    }
  }
  
  return distractors.slice(0, 3);
};

// Helper functions
const isGenericContent = (content: string): boolean => {
  const genericTerms = [
    'this', 'that', 'these', 'those', 'it', 'they', 'them', 'something', 'anything',
    'everything', 'nothing', 'someone', 'anyone', 'everyone', 'thing', 'things',
    'way', 'ways', 'time', 'times', 'place', 'places', 'people', 'person'
  ];
  
  const lowerContent = content.toLowerCase();
  return genericTerms.some(term => lowerContent.includes(term)) ||
         content.length < 5 ||
         /^[A-Z\s]+$/.test(content) ||
         /^\d+$/.test(content);
};

const containsImportantInfo = (sentence: string): boolean => {
  // Check for indicators of important information
  const importantIndicators = [
    /\b(?:important|significant|crucial|essential|key|main|primary|major)\b/i,
    /\b(?:because|since|due to|as a result|therefore|thus|consequently)\b/i,
    /\b(?:first|second|third|finally|lastly|initially|subsequently)\b/i,
    /\b(?:\d+%|\d+\s+(?:years?|months?|days?)|19\d{2}|20\d{2}|\$\d+)\b/i,
    /\b(?:always|never|must|should|required|necessary|essential)\b/i
  ];
  
  return importantIndicators.some(pattern => pattern.test(sentence));
};

const extractSubject = (sentence: string): string | null => {
  // Try to extract the main subject of the sentence
  const subjectPatterns = [
    /^(The\s+[^,]+?)(?:\s+is|\s+are|\s+was|\s+were|\s+has|\s+have|\s+does|\s+do)/i,
    /^([A-Z][^,]+?)(?:\s+is|\s+are|\s+was|\s+were|\s+has|\s+have|\s+does|\s+do)/i,
    /^([^,]+?)(?:\s+is|\s+are|\s+was|\s+were|\s+has|\s+have|\s+does|\s+do)/i
  ];
  
  for (const pattern of subjectPatterns) {
    const match = sentence.match(pattern);
    if (match && match[1]) {
      const subject = match[1].trim().replace(/^(The|A|An)\s+/i, '');
      if (subject.length > 3 && subject.length < 60 && !isGenericContent(subject)) {
        return subject;
      }
    }
  }
  
  return null;
};

const extractRelevantPart = (sentence: string, type: string): string | null => {
  switch (type) {
    case 'definition':
      const defMatch = sentence.match(/(?:is|are|means|refers to|represents)\s+(.+)$/i);
      return defMatch ? defMatch[1].trim() : null;
    
    case 'action':
      const actionMatch = sentence.match(/(?:does|performs|executes|carries out|accomplishes)\s+(.+)$/i);
      return actionMatch ? actionMatch[1].trim() : null;
    
    case 'possession':
      const possMatch = sentence.match(/(?:has|have|possesses|contains|includes)\s+(.+)$/i);
      return possMatch ? possMatch[1].trim() : null;
    
    case 'condition':
      const condMatch = sentence.match(/(?:when|if|during|while|as)\s+(.+)$/i);
      return condMatch ? `when ${condMatch[1].trim()}` : null;
    
    case 'location':
      const locMatch = sentence.match(/(?:in|at|on|within|inside|outside)\s+(.+)$/i);
      return locMatch ? locMatch[1].trim() : null;
    
    default:
      return sentence.length < 120 ? sentence : null;
  }
};

const getGenericDistractors = (type: string): string[] => {
  const distractorSets = {
    definition: [
      'a systematic approach to organizing complex information',
      'a methodological framework for data analysis',
      'a comprehensive strategy for performance optimization',
      'a theoretical model for understanding relationships'
    ],
    action: [
      'processes information systematically',
      'manages complex data structures',
      'optimizes performance metrics',
      'coordinates multiple system components'
    ],
    possession: [
      'multiple integrated components',
      'advanced processing capabilities',
      'comprehensive analytical features',
      'sophisticated control mechanisms'
    ],
    condition: [
      'when specific parameters are met',
      'when optimal conditions are present',
      'when system requirements are satisfied',
      'when appropriate resources are available'
    ],
    location: [
      'within the central processing unit',
      'in the primary data storage area',
      'at the main control interface',
      'inside the core system module'
    ]
  };
  
  return distractorSets[type] || distractorSets.definition;
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};