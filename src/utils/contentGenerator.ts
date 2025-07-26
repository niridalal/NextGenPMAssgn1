import { Flashcard, QuizQuestion } from '../types';

// Enhanced PDF content analysis and generation
export const generateFlashcards = (text: string): Flashcard[] => {
  console.log('Starting flashcard generation with text length:', text.length);
  
  // Step 1: Clean and analyze the text
  const analysis = analyzeDocumentContent(text);
  console.log('Document analysis complete:', {
    sentences: analysis.sentences.length,
    keyTerms: analysis.keyTerms.length,
    concepts: analysis.concepts.length,
    facts: analysis.facts.length
  });
  
  // Step 2: Extract high-quality flashcard content
  const flashcardContent = extractFlashcardContent(analysis);
  console.log('Extracted flashcard content:', flashcardContent.length);
  
  // Step 3: Generate flashcards with proper validation
  const flashcards = createFlashcards(flashcardContent);
  console.log('Generated flashcards:', flashcards.length);
  
  return flashcards;
};

export const generateQuizQuestions = (text: string): QuizQuestion[] => {
  console.log('Starting quiz generation with text length:', text.length);
  
  // Step 1: Analyze document for quiz-worthy content
  const analysis = analyzeDocumentContent(text);
  
  // Step 2: Extract quiz question content
  const quizContent = extractQuizContent(analysis);
  console.log('Extracted quiz content:', quizContent.length);
  
  // Step 3: Generate quiz questions with proper validation
  const questions = createQuizQuestions(quizContent, analysis);
  console.log('Generated quiz questions:', questions.length);
  
  return questions;
};

// Core document analysis function
interface DocumentAnalysis {
  sentences: string[];
  paragraphs: string[];
  keyTerms: Array<{term: string, context: string, definition?: string}>;
  concepts: Array<{concept: string, explanation: string, context: string}>;
  facts: Array<{fact: string, context: string, type: 'numerical' | 'date' | 'location' | 'general'}>;
  processes: Array<{process: string, steps: string[], context: string}>;
  relationships: Array<{subject: string, relationship: string, object: string, context: string}>;
  examples: Array<{concept: string, example: string, context: string}>;
}

const analyzeDocumentContent = (text: string): DocumentAnalysis => {
  // Clean the text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-"']/g, '')
    .trim();
  
  // Split into sentences and paragraphs
  const sentences = cleanText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300)
    .filter(s => !isLowQualitySentence(s));
  
  const paragraphs = cleanText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 100);
  
  console.log('Text analysis:', {
    originalLength: text.length,
    cleanLength: cleanText.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length
  });
  
  // Extract different types of content
  const keyTerms = extractKeyTerms(sentences);
  const concepts = extractConcepts(sentences);
  const facts = extractFacts(sentences);
  const processes = extractProcesses(sentences);
  const relationships = extractRelationships(sentences);
  const examples = extractExamples(sentences);
  
  return {
    sentences,
    paragraphs,
    keyTerms,
    concepts,
    facts,
    processes,
    relationships,
    examples
  };
};

// Extract key terms and their definitions
const extractKeyTerms = (sentences: string[]): Array<{term: string, context: string, definition?: string}> => {
  const keyTerms: Array<{term: string, context: string, definition?: string}> = [];
  
  sentences.forEach(sentence => {
    // Pattern 1: "Term is definition" or "A term is definition"
    const definitionPattern1 = /^(?:The\s+|A\s+|An\s+)?([A-Z][a-zA-Z\s]{2,40})\s+is\s+([^.!?]+)$/i;
    const match1 = sentence.match(definitionPattern1);
    if (match1) {
      const term = match1[1].trim();
      const definition = match1[2].trim();
      if (isValidTerm(term) && isValidDefinition(definition)) {
        keyTerms.push({
          term: term,
          context: sentence,
          definition: definition
        });
      }
    }
    
    // Pattern 2: "Term means definition" or "Term refers to definition"
    const definitionPattern2 = /^([A-Z][a-zA-Z\s]{2,40})\s+(?:means|refers to|denotes|represents)\s+([^.!?]+)$/i;
    const match2 = sentence.match(definitionPattern2);
    if (match2) {
      const term = match2[1].trim();
      const definition = match2[2].trim();
      if (isValidTerm(term) && isValidDefinition(definition)) {
        keyTerms.push({
          term: term,
          context: sentence,
          definition: definition
        });
      }
    }
    
    // Pattern 3: "Term, which is definition," or "Term (definition)"
    const definitionPattern3 = /([A-Z][a-zA-Z\s]{2,40})(?:,\s*which\s+is\s+([^,]+),|\s*\(([^)]+)\))/i;
    const match3 = sentence.match(definitionPattern3);
    if (match3) {
      const term = match3[1].trim();
      const definition = (match3[2] || match3[3] || '').trim();
      if (isValidTerm(term) && isValidDefinition(definition)) {
        keyTerms.push({
          term: term,
          context: sentence,
          definition: definition
        });
      }
    }
    
    // Pattern 4: Look for capitalized terms that might be important
    const capitalizedTerms = sentence.match(/\b[A-Z][a-zA-Z]{2,}\s+[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?\b/g);
    if (capitalizedTerms) {
      capitalizedTerms.forEach(term => {
        if (isValidTerm(term) && !keyTerms.some(kt => kt.term.toLowerCase() === term.toLowerCase())) {
          keyTerms.push({
            term: term.trim(),
            context: sentence
          });
        }
      });
    }
  });
  
  return keyTerms.slice(0, 15); // Limit to most relevant terms
};

// Extract concepts and their explanations
const extractConcepts = (sentences: string[]): Array<{concept: string, explanation: string, context: string}> => {
  const concepts: Array<{concept: string, explanation: string, context: string}> = [];
  
  sentences.forEach(sentence => {
    // Pattern 1: "The concept of X involves Y"
    const conceptPattern1 = /(?:The\s+)?concept\s+of\s+([^,]+),?\s+(?:involves|includes|encompasses|comprises)\s+([^.!?]+)/i;
    const match1 = sentence.match(conceptPattern1);
    if (match1) {
      const concept = match1[1].trim();
      const explanation = match1[2].trim();
      if (isValidConcept(concept) && explanation.length > 20) {
        concepts.push({
          concept: concept,
          explanation: explanation,
          context: sentence
        });
      }
    }
    
    // Pattern 2: "X theory states that Y" or "X principle suggests that Y"
    const conceptPattern2 = /([A-Z][a-zA-Z\s]{3,30})\s+(?:theory|principle|law|rule|concept)\s+(?:states|suggests|indicates|shows|demonstrates)\s+that\s+([^.!?]+)/i;
    const match2 = sentence.match(conceptPattern2);
    if (match2) {
      const concept = match2[1].trim() + ' theory/principle';
      const explanation = match2[2].trim();
      if (explanation.length > 20) {
        concepts.push({
          concept: concept,
          explanation: explanation,
          context: sentence
        });
      }
    }
    
    // Pattern 3: "X is important because Y" or "X is significant because Y"
    const conceptPattern3 = /([A-Z][a-zA-Z\s]{3,40})\s+is\s+(?:important|significant|crucial|essential|vital)\s+because\s+([^.!?]+)/i;
    const match3 = sentence.match(conceptPattern3);
    if (match3) {
      const concept = match3[1].trim();
      const explanation = match3[2].trim();
      if (isValidConcept(concept) && explanation.length > 20) {
        concepts.push({
          concept: concept,
          explanation: `Important because ${explanation}`,
          context: sentence
        });
      }
    }
  });
  
  return concepts.slice(0, 12);
};

// Extract factual information
const extractFacts = (sentences: string[]): Array<{fact: string, context: string, type: 'numerical' | 'date' | 'location' | 'general'}> => {
  const facts: Array<{fact: string, context: string, type: 'numerical' | 'date' | 'location' | 'general'}> = [];
  
  sentences.forEach(sentence => {
    // Numerical facts
    const numericalPattern = /([^.!?]*(?:\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|hundred)?|(?:19|20)\d{2})[^.!?]*)/i;
    if (numericalPattern.test(sentence)) {
      const numbers = sentence.match(/\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|hundred)?|(?:19|20)\d{2}/g);
      if (numbers && numbers.length > 0) {
        facts.push({
          fact: sentence,
          context: sentence,
          type: 'numerical'
        });
      }
    }
    
    // Date facts
    const datePattern = /\b(?:(?:19|20)\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})\b/i;
    if (datePattern.test(sentence)) {
      facts.push({
        fact: sentence,
        context: sentence,
        type: 'date'
      });
    }
    
    // Location facts
    const locationPattern = /\b(?:in|at|located in|situated in|found in)\s+([A-Z][a-zA-Z\s,]{3,40})\b/i;
    const locationMatch = sentence.match(locationPattern);
    if (locationMatch) {
      facts.push({
        fact: sentence,
        context: sentence,
        type: 'location'
      });
    }
    
    // General important facts (sentences with specific indicators)
    const factIndicators = /\b(?:research shows|studies indicate|evidence suggests|data reveals|findings show|results demonstrate|statistics show)\b/i;
    if (factIndicators.test(sentence)) {
      facts.push({
        fact: sentence,
        context: sentence,
        type: 'general'
      });
    }
  });
  
  return facts.slice(0, 10);
};

// Extract processes and procedures
const extractProcesses = (sentences: string[]): Array<{process: string, steps: string[], context: string}> => {
  const processes: Array<{process: string, steps: string[], context: string}> = [];
  
  sentences.forEach(sentence => {
    // Pattern 1: "The process of X involves Y"
    const processPattern1 = /(?:The\s+)?process\s+of\s+([^,]+)\s+(?:involves|includes|consists of|comprises)\s+([^.!?]+)/i;
    const match1 = sentence.match(processPattern1);
    if (match1) {
      const process = match1[1].trim();
      const stepsText = match1[2].trim();
      const steps = extractStepsFromText(stepsText);
      if (steps.length > 0) {
        processes.push({
          process: process,
          steps: steps,
          context: sentence
        });
      }
    }
    
    // Pattern 2: "To X, you must Y" or "In order to X, Y"
    const processPattern2 = /(?:To|In order to)\s+([^,]+),\s+(?:you must|one must|it is necessary to|you need to)\s+([^.!?]+)/i;
    const match2 = sentence.match(processPattern2);
    if (match2) {
      const process = match2[1].trim();
      const step = match2[2].trim();
      processes.push({
        process: process,
        steps: [step],
        context: sentence
      });
    }
    
    // Pattern 3: Sequential indicators
    const sequentialPattern = /\b(?:first|second|third|then|next|finally|lastly|initially|subsequently)\b/i;
    if (sequentialPattern.test(sentence)) {
      const steps = sentence.split(/\b(?:first|second|third|then|next|finally|lastly|initially|subsequently)\b/i)
        .map(s => s.trim())
        .filter(s => s.length > 10);
      
      if (steps.length > 1) {
        processes.push({
          process: 'Sequential process',
          steps: steps,
          context: sentence
        });
      }
    }
  });
  
  return processes.slice(0, 8);
};

// Extract relationships between concepts
const extractRelationships = (sentences: string[]): Array<{subject: string, relationship: string, object: string, context: string}> => {
  const relationships: Array<{subject: string, relationship: string, object: string, context: string}> = [];
  
  sentences.forEach(sentence => {
    // Pattern 1: "X causes Y" or "X leads to Y"
    const causalPattern = /([A-Z][a-zA-Z\s]{3,40})\s+(causes|leads to|results in|produces|creates|generates)\s+([^.!?]+)/i;
    const causalMatch = sentence.match(causalPattern);
    if (causalMatch) {
      relationships.push({
        subject: causalMatch[1].trim(),
        relationship: causalMatch[2].trim(),
        object: causalMatch[3].trim(),
        context: sentence
      });
    }
    
    // Pattern 2: "X is related to Y" or "X is associated with Y"
    const relationPattern = /([A-Z][a-zA-Z\s]{3,40})\s+is\s+(?:related to|associated with|connected to|linked to)\s+([^.!?]+)/i;
    const relationMatch = sentence.match(relationPattern);
    if (relationMatch) {
      relationships.push({
        subject: relationMatch[1].trim(),
        relationship: 'is related to',
        object: relationMatch[2].trim(),
        context: sentence
      });
    }
    
    // Pattern 3: "X affects Y" or "X influences Y"
    const influencePattern = /([A-Z][a-zA-Z\s]{3,40})\s+(affects|influences|impacts|modifies|changes)\s+([^.!?]+)/i;
    const influenceMatch = sentence.match(influencePattern);
    if (influenceMatch) {
      relationships.push({
        subject: influenceMatch[1].trim(),
        relationship: influenceMatch[2].trim(),
        object: influenceMatch[3].trim(),
        context: sentence
      });
    }
  });
  
  return relationships.slice(0, 10);
};

// Extract examples
const extractExamples = (sentences: string[]): Array<{concept: string, example: string, context: string}> => {
  const examples: Array<{concept: string, example: string, context: string}> = [];
  
  sentences.forEach(sentence => {
    // Pattern 1: "For example, X" or "Such as X"
    const examplePattern1 = /([^.!?]*)\b(?:for example|such as|including|like)\s+([^.!?]+)/i;
    const match1 = sentence.match(examplePattern1);
    if (match1) {
      const concept = match1[1].trim();
      const example = match1[2].trim();
      if (concept.length > 10 && example.length > 10) {
        examples.push({
          concept: concept,
          example: example,
          context: sentence
        });
      }
    }
    
    // Pattern 2: "X, for instance, Y"
    const examplePattern2 = /([^,]+),\s*for instance,\s*([^.!?]+)/i;
    const match2 = sentence.match(examplePattern2);
    if (match2) {
      const concept = match2[1].trim();
      const example = match2[2].trim();
      if (concept.length > 10 && example.length > 10) {
        examples.push({
          concept: concept,
          example: example,
          context: sentence
        });
      }
    }
  });
  
  return examples.slice(0, 8);
};

// Create flashcards from analyzed content
const extractFlashcardContent = (analysis: DocumentAnalysis): Array<{question: string, answer: string, category: string, quality: number}> => {
  const flashcardContent: Array<{question: string, answer: string, category: string, quality: number}> = [];
  
  // From key terms with definitions
  analysis.keyTerms.forEach(term => {
    if (term.definition) {
      flashcardContent.push({
        question: `What is ${term.term}?`,
        answer: term.definition,
        category: 'Definition',
        quality: 9
      });
    } else {
      // Create a question from context
      flashcardContent.push({
        question: `What can you tell me about ${term.term}?`,
        answer: extractAnswerFromContext(term.context, term.term),
        category: 'Key Term',
        quality: 7
      });
    }
  });
  
  // From concepts
  analysis.concepts.forEach(concept => {
    flashcardContent.push({
      question: `Explain the concept of ${concept.concept}`,
      answer: concept.explanation,
      category: 'Concept',
      quality: 8
    });
  });
  
  // From processes
  analysis.processes.forEach(process => {
    if (process.steps.length > 1) {
      flashcardContent.push({
        question: `What are the steps involved in ${process.process}?`,
        answer: process.steps.join('; '),
        category: 'Process',
        quality: 8
      });
    } else if (process.steps.length === 1) {
      flashcardContent.push({
        question: `How do you ${process.process}?`,
        answer: process.steps[0],
        category: 'Process',
        quality: 7
      });
    }
  });
  
  // From relationships
  analysis.relationships.forEach(rel => {
    flashcardContent.push({
      question: `What is the relationship between ${rel.subject} and ${rel.object}?`,
      answer: `${rel.subject} ${rel.relationship} ${rel.object}`,
      category: 'Relationship',
      quality: 7
    });
  });
  
  // From facts
  analysis.facts.forEach(fact => {
    const question = createQuestionFromFact(fact.fact, fact.type);
    if (question) {
      flashcardContent.push({
        question: question,
        answer: fact.fact,
        category: 'Fact',
        quality: 6
      });
    }
  });
  
  // From examples
  analysis.examples.forEach(example => {
    flashcardContent.push({
      question: `Give an example of ${example.concept}`,
      answer: example.example,
      category: 'Example',
      quality: 6
    });
  });
  
  // Sort by quality and return top items
  return flashcardContent
    .sort((a, b) => b.quality - a.quality)
    .slice(0, 20);
};

// Create quiz content from analyzed content
const extractQuizContent = (analysis: DocumentAnalysis): Array<{question: string, correctAnswer: string, type: string, context: string, quality: number}> => {
  const quizContent: Array<{question: string, correctAnswer: string, type: string, context: string, quality: number}> = [];
  
  // From key terms with definitions
  analysis.keyTerms.forEach(term => {
    if (term.definition) {
      quizContent.push({
        question: `What is ${term.term}?`,
        correctAnswer: term.definition,
        type: 'definition',
        context: term.context,
        quality: 9
      });
    }
  });
  
  // From concepts
  analysis.concepts.forEach(concept => {
    quizContent.push({
      question: `Which statement best describes ${concept.concept}?`,
      correctAnswer: concept.explanation,
      type: 'concept',
      context: concept.context,
      quality: 8
    });
  });
  
  // From facts
  analysis.facts.forEach(fact => {
    if (fact.type === 'numerical') {
      const numbers = fact.fact.match(/\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|hundred)?/g);
      if (numbers && numbers.length > 0) {
        quizContent.push({
          question: createNumericalQuestion(fact.fact),
          correctAnswer: numbers[0],
          type: 'numerical',
          context: fact.context,
          quality: 8
        });
      }
    } else {
      const question = createFactualQuestion(fact.fact);
      if (question) {
        quizContent.push({
          question: question,
          correctAnswer: extractFactualAnswer(fact.fact),
          type: 'factual',
          context: fact.context,
          quality: 7
        });
      }
    }
  });
  
  // From relationships
  analysis.relationships.forEach(rel => {
    quizContent.push({
      question: `What does ${rel.subject} ${rel.relationship}?`,
      correctAnswer: rel.object,
      type: 'relationship',
      context: rel.context,
      quality: 7
    });
  });
  
  // From processes
  analysis.processes.forEach(process => {
    if (process.steps.length > 1) {
      quizContent.push({
        question: `What is the first step in ${process.process}?`,
        correctAnswer: process.steps[0],
        type: 'process',
        context: process.context,
        quality: 7
      });
    }
  });
  
  return quizContent
    .sort((a, b) => b.quality - a.quality)
    .slice(0, 15);
};

// Create final flashcards
const createFlashcards = (content: Array<{question: string, answer: string, category: string, quality: number}>): Flashcard[] => {
  return content.map((item, index) => ({
    id: index + 1,
    question: item.question,
    answer: item.answer,
    category: item.category
  }));
};

// Create final quiz questions
const createQuizQuestions = (content: Array<{question: string, correctAnswer: string, type: string, context: string, quality: number}>, analysis: DocumentAnalysis): QuizQuestion[] => {
  return content.map((item, index) => {
    const distractors = generateSmartDistractors(item.correctAnswer, item.type, analysis);
    const options = [item.correctAnswer, ...distractors];
    const shuffledOptions = shuffleArray(options);
    const correctIndex = shuffledOptions.indexOf(item.correctAnswer);
    
    return {
      id: index + 1,
      question: item.question,
      options: shuffledOptions,
      correctAnswer: correctIndex,
      explanation: `The correct answer is "${item.correctAnswer}". This information is found in the document: ${item.context.substring(0, 100)}...`
    };
  });
};

// Helper functions
const isLowQualitySentence = (sentence: string): boolean => {
  const lowQualityPatterns = [
    /^(?:this|that|these|those|it|they)\s/i,
    /^(?:here|there)\s/i,
    /^(?:yes|no|maybe|perhaps)\s*[.!?]*$/i,
    /^\d+\s*[.!?]*$/,
    /^[A-Z\s]+$/,
    /^.{1,15}$/
  ];
  
  return lowQualityPatterns.some(pattern => pattern.test(sentence)) ||
         sentence.split(' ').length < 5 ||
         sentence.split(' ').length > 50;
};

const isValidTerm = (term: string): boolean => {
  return term.length >= 3 && 
         term.length <= 50 && 
         !/^(?:this|that|these|those|it|they|the|a|an)$/i.test(term) &&
         /[A-Za-z]/.test(term);
};

const isValidDefinition = (definition: string): boolean => {
  return definition.length >= 15 && 
         definition.length <= 200 &&
         !/^(?:this|that|these|those|it|they)$/i.test(definition.trim());
};

const isValidConcept = (concept: string): boolean => {
  return concept.length >= 5 && 
         concept.length <= 60 &&
         !/^(?:this|that|these|those|it|they|the|a|an)$/i.test(concept);
};

const extractStepsFromText = (text: string): string[] => {
  // Look for numbered steps or sequential indicators
  const steps: string[] = [];
  
  // Pattern 1: Numbered steps (1., 2., 3., etc.)
  const numberedSteps = text.match(/\d+\.\s*([^.]+)/g);
  if (numberedSteps) {
    return numberedSteps.map(step => step.replace(/^\d+\.\s*/, '').trim());
  }
  
  // Pattern 2: Sequential words
  const sequentialSplit = text.split(/\b(?:first|second|third|then|next|finally|lastly)\b/i);
  if (sequentialSplit.length > 1) {
    return sequentialSplit.map(s => s.trim()).filter(s => s.length > 5);
  }
  
  // Pattern 3: Comma or semicolon separated
  const commaSplit = text.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 10);
  if (commaSplit.length > 1) {
    return commaSplit.slice(0, 5); // Limit to 5 steps
  }
  
  return [text]; // Return as single step if no pattern found
};

const extractAnswerFromContext = (context: string, term: string): string => {
  // Try to extract meaningful information about the term from its context
  const sentences = context.split(/[.!?]+/);
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(term.toLowerCase())) {
      // Remove the term from the sentence to create an answer
      const answer = sentence.replace(new RegExp(term, 'gi'), '').trim();
      if (answer.length > 20) {
        return answer.replace(/^[,\s]+|[,\s]+$/g, '');
      }
    }
  }
  return context.substring(0, 150) + '...';
};

const createQuestionFromFact = (fact: string, type: string): string | null => {
  switch (type) {
    case 'numerical':
      const numbers = fact.match(/\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|hundred)?/g);
      if (numbers) {
        return `What is the numerical value mentioned in relation to this fact?`;
      }
      break;
    case 'date':
      return `When did this event occur?`;
    case 'location':
      return `Where does this take place?`;
    default:
      return `What is this important fact?`;
  }
  return null;
};

const createNumericalQuestion = (fact: string): string => {
  // Extract the subject of the numerical fact
  const beforeNumber = fact.split(/\d/)[0];
  if (beforeNumber.length > 10) {
    return `What is the numerical value associated with ${beforeNumber.trim()}?`;
  }
  return `What is the numerical value mentioned in this context?`;
};

const createFactualQuestion = (fact: string): string => {
  // Create a question based on the fact structure
  if (fact.includes(' is ') || fact.includes(' are ')) {
    const parts = fact.split(/ (?:is|are) /);
    if (parts.length >= 2 && parts[0].length < 50) {
      return `What is true about ${parts[0].trim()}?`;
    }
  }
  return `What does the document state about this topic?`;
};

const extractFactualAnswer = (fact: string): string => {
  // Extract the key part of the fact as the answer
  if (fact.includes(' is ') || fact.includes(' are ')) {
    const parts = fact.split(/ (?:is|are) /);
    if (parts.length >= 2) {
      return parts[1].trim();
    }
  }
  return fact.length > 100 ? fact.substring(0, 100) + '...' : fact;
};

const generateSmartDistractors = (correctAnswer: string, type: string, analysis: DocumentAnalysis): string[] => {
  const distractors: string[] = [];
  
  switch (type) {
    case 'definition':
      // Use other definitions from the document
      analysis.keyTerms.forEach(term => {
        if (term.definition && term.definition !== correctAnswer && distractors.length < 3) {
          distractors.push(term.definition);
        }
      });
      break;
      
    case 'concept':
      // Use other concept explanations
      analysis.concepts.forEach(concept => {
        if (concept.explanation !== correctAnswer && distractors.length < 3) {
          distractors.push(concept.explanation);
        }
      });
      break;
      
    case 'numerical':
      // Generate numerical variations
      const numbers = correctAnswer.match(/\d+(?:\.\d+)?/g);
      if (numbers) {
        const baseNumber = parseFloat(numbers[0]);
        const variations = [
          String(Math.floor(baseNumber * 0.8)),
          String(Math.floor(baseNumber * 1.2)),
          String(Math.floor(baseNumber * 0.5))
        ];
        distractors.push(...variations.slice(0, 3));
      }
      break;
      
    case 'factual':
    case 'relationship':
    case 'process':
      // Use other facts or relationships from the document
      const allContent = [
        ...analysis.facts.map(f => f.fact),
        ...analysis.relationships.map(r => r.object),
        ...analysis.processes.map(p => p.steps[0] || '')
      ].filter(content => content !== correctAnswer && content.length > 10 && content.length < 150);
      
      distractors.push(...allContent.slice(0, 3));
      break;
  }
  
  // Fill remaining slots with generic but plausible distractors
  const genericDistractors = getGenericDistractorsByType(type);
  while (distractors.length < 3) {
    const randomDistractor = genericDistractors[Math.floor(Math.random() * genericDistractors.length)];
    if (!distractors.includes(randomDistractor)) {
      distractors.push(randomDistractor);
    }
  }
  
  return distractors.slice(0, 3);
};

const getGenericDistractorsByType = (type: string): string[] => {
  const genericSets = {
    definition: [
      'A systematic approach to problem-solving and analysis',
      'A comprehensive framework for understanding complex relationships',
      'A methodological process for organizing and interpreting data',
      'A theoretical model for explaining observed phenomena'
    ],
    concept: [
      'This concept focuses on the integration of multiple variables',
      'This approach emphasizes the importance of systematic analysis',
      'This framework provides a structured method for evaluation',
      'This theory explains the underlying mechanisms of the process'
    ],
    numerical: ['50', '100', '25', '75', '200', '10', '5'],
    factual: [
      'This is supported by extensive research and documentation',
      'This has been validated through multiple independent studies',
      'This represents a significant advancement in the field',
      'This demonstrates the effectiveness of the proposed method'
    ],
    relationship: [
      'directly influences the overall system performance',
      'is closely connected to the primary operational factors',
      'significantly impacts the efficiency of the process',
      'plays a crucial role in determining the final outcome'
    ],
    process: [
      'Begin by establishing clear objectives and parameters',
      'Start with a comprehensive analysis of the requirements',
      'Initiate the process by gathering relevant information',
      'Commence with a thorough evaluation of the conditions'
    ]
  };
  
  return genericSets[type] || genericSets.factual;
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};